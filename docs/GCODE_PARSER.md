# Respool — G-Code Parser Specification

## Overview

The spool swap calculator includes a client-side G-code parser that extracts per-layer filament extrusion data. This runs entirely in the browser via `FileReader` — no G-code data is ever sent to the server.

Currently optimized for **AnkerMake / EufyMake Studio** generated G-code, but designed to be extensible for other slicers.

---

## Critical Parsing Rules

These rules were derived from real-world debugging with AnkerMake M5 / EufyMake Studio G-code. Each one addresses a specific bug that caused incorrect calculations.

### 1. Layer Detection — Only `;LAYER:N`

**Rule:** Only count lines matching `^;LAYER:\d+` as layer boundaries.

**Do NOT count:**
- `;LAYER_CHANGE` — AnkerMake outputs this alongside `;LAYER:N`, causing double-counting
- `;Z:` comments — these are informational, not layer boundaries
- `;BEFORE_LAYER_CHANGE` / `;AFTER_LAYER_CHANGE` — also informational
- Z-only G0/G1 moves (e.g., `G1 Z0.34 F9000`) — these are Z-hops, not layer changes
- G2/G3 arc moves with Z (e.g., `G3 Z.14 I-.378 J.197 P1 F9000`) — these are spiral moves

**Why:** AnkerMake G-code contains all of the above for every layer. Counting any combination of them doubles or triples the layer count. Only `;LAYER:N` is reliable.

**For future slicer support:** Other slicers may use different patterns:
- PrusaSlicer/OrcaSlicer: `;LAYER_CHANGE` (without `;LAYER:N`)
- Simplify3D: `; layer N`
- Cura: `;LAYER:N`

When adding support for other slicers, detect the slicer from header comments and switch detection patterns accordingly.

### 2. Extrusion Mode Detection — Word Boundary Match

**Rule:** Match `M83` and `M82` with word boundary (`\b`), not exact string equality.

```javascript
// CORRECT
if (/^M83\b/.test(line)) isRelative = true;
if (/^M82\b/.test(line)) isRelative = false;

// WRONG — fails on "M83 ; use relative distances for extrusion"
if (line === "M83") isRelative = true;
```

**Why:** AnkerMake outputs `M83 ; use relative distances for extrusion` with a trailing comment. Exact string match (`===`) fails, causing the parser to never switch to relative mode, which completely breaks extrusion calculations.

### 3. Filter Retraction — Only Count E on XY Moves

**Rule:** Only count extrusion (E values) on G0/G1 moves that also contain X or Y coordinates.

```javascript
// CORRECT — only count E when there's actual movement
if (/^G[01]\s/.test(line) && /[XY]/.test(line)) {
  const eMatch = line.match(/E([-\d.]+)/);
  // ... count this extrusion
}

// WRONG — counts retraction/unretraction as extrusion
if (/^G[01]\s/.test(line)) {
  const eMatch = line.match(/E([-\d.]+)/);
  // ... this includes retraction moves like "G1 E3 F3600"
}
```

**Why:** FDM printers retract filament (pull it back) before travel moves to prevent stringing, then unretract (push it forward) when starting the next extrusion. These moves look like `G1 E-3 F3600` (retract) and `G1 E3 F3600` (unretract) with no X/Y coordinates. Counting them as extrusion inflated the total by ~60% in testing.

### 4. Handle G92 E0 Resets

**Rule:** When `G92 E0` is encountered, reset the absolute E position tracker to 0.

```javascript
if (/^G92\s/.test(line) && /E0/.test(line)) lastE = 0;
```

**Why:** Slicers periodically reset the extruder position to prevent floating-point precision issues. Without handling this, absolute mode calculations break after the first reset.

### 5. Header Weight as Authoritative Total

**Rule:** Read the slicer's reported filament weight from header comments and use it as the authoritative total. Scale per-layer parsed values proportionally to match.

```javascript
// AnkerMake format
const weightMatch = line.match(/^;Filament weight:\s*([\d.]+)\s*g/i);
```

**Why:** The slicer has perfect knowledge of filament usage. Our parser gets very close (~99.9%) but tiny rounding differences across 200k+ extrusion moves can add up. Using the header weight as truth and scaling per-layer values eliminates any drift.

**Fallback:** If no header weight is found, use the parsed total directly.

---

## Parser Implementation

```typescript
// src/lib/gcode-parser.ts

const FILAMENT_DIAMETER = 1.75; // mm (default, configurable)

interface ParsedLayer {
  layer: number;
  grams: number;     // filament used this layer
  cumGrams: number;   // cumulative grams through this layer
}

interface ParseResult {
  layers: ParsedLayer[];
  totalGrams: number;
  totalLayers: number;
  headerGrams: number | null;   // slicer-reported weight if found
  parsedGrams: number;          // our calculated weight
}

export function parseGcode(text: string, density: number): ParseResult {
  const lines = text.split("\n");
  const filamentArea = Math.PI * (FILAMENT_DIAMETER / 2) ** 2;

  let layers: { layer: number; extrusion: number }[] = [];
  let currentLayer = -1;
  let layerExtrusion = 0;
  let isRelative = false;
  let lastE = 0;
  let headerGrams: number | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Read slicer-reported weight from header
    const weightMatch = line.match(/^;Filament weight:\s*([\d.]+)\s*g/i);
    if (weightMatch) headerGrams = parseFloat(weightMatch[1]);

    // Extrusion mode (word boundary for trailing comments)
    if (/^M83\b/.test(line)) isRelative = true;
    if (/^M82\b/.test(line)) isRelative = false;

    // Layer detection — ONLY ;LAYER:N
    const isLayerChange = /^;LAYER:\d+/i.test(line);

    if (isLayerChange && currentLayer >= 0) {
      layers.push({ layer: currentLayer, extrusion: layerExtrusion });
      layerExtrusion = 0;
    }
    if (isLayerChange) currentLayer++;

    // Extrusion — only on moves with X or Y (filters retraction)
    if (/^G[01]\s/.test(line) && /[XY]/.test(line)) {
      const eMatch = line.match(/E([-\d.]+)/);
      if (eMatch) {
        const eVal = parseFloat(eMatch[1]);
        if (isRelative) {
          if (eVal > 0) layerExtrusion += eVal;
        } else {
          if (eVal > lastE) layerExtrusion += eVal - lastE;
          lastE = eVal;
        }
      }
    }

    // E position reset
    if (/^G92\s/.test(line) && /E0/.test(line)) lastE = 0;
  }

  // Push final layer
  if (currentLayer >= 0 && layerExtrusion > 0) {
    layers.push({ layer: currentLayer, extrusion: layerExtrusion });
  }

  // Convert mm of extrusion to grams
  // volume = length_mm × area_mm² = mm³, then ÷1000 for cm³, × density for grams
  const gramsLayers = layers.map((l) => ({
    ...l,
    grams: (l.extrusion * filamentArea * density) / 1000,
  }));

  const parsedGrams = gramsLayers.reduce((sum, l) => sum + l.grams, 0);

  // Use slicer header weight as truth if available, scale proportionally
  const totalGrams = headerGrams ?? parsedGrams;
  const scale = parsedGrams > 0 ? totalGrams / parsedGrams : 1;

  let cum = 0;
  const cumulativeLayers: ParsedLayer[] = gramsLayers.map((l) => {
    const g = l.grams * scale;
    cum += g;
    return { layer: l.layer, grams: g, cumGrams: cum };
  });

  return {
    layers: cumulativeLayers,
    totalGrams,
    totalLayers: cumulativeLayers.length,
    headerGrams,
    parsedGrams: Math.round(parsedGrams * 10) / 10,
  };
}
```

---

## Swap Point Calculation

```typescript
// src/lib/filament-utils.ts

export const MATERIAL_DENSITIES: Record<string, number> = {
  PLA: 1.24,
  "PLA+": 1.24,
  PETG: 1.27,
  ABS: 1.04,
  TPU: 1.21,
  ASA: 1.07,
  PC: 1.20,
  HIPS: 1.04,
  PVA: 1.23,
};

export function mmToGrams(mm: number, density: number): number {
  const area = Math.PI * (1.75 / 2) ** 2; // mm²
  return (mm * area * density) / 1000;
}

interface SwapScheduleEntry {
  spool: number;           // 1-indexed spool number
  gramsAvailable: number;  // total grams on this spool
  gramsUsed: number;       // grams consumed for printing
  purgeGrams: number;      // grams consumed for purge/prime
  startLayer: number;      // first layer printed with this spool
  endLayer: number;        // last layer printed with this spool
  pauseBeforeLayer: number | null;  // layer to set EufyMake marker on (null = final spool)
}

export function calculateSwapPoints(
  layers: ParsedLayer[],
  spoolWeights: number[],    // grams remaining per spool, in order
  purgeGrams: number,        // grams consumed per spool load
  totalLayers: number,
): SwapScheduleEntry[] {
  const schedule: SwapScheduleEntry[] = [];
  let spoolIdx = 0;
  let spoolRemaining = spoolWeights[0] - purgeGrams; // deduct initial load purge
  let spoolStartLayer = 1;
  let spoolGramsUsed = 0;

  for (let i = 0; i < layers.length; i++) {
    const layerG = layers[i].grams;

    if (layerG > spoolRemaining) {
      // Current spool can't handle this layer — pause before it
      const pauseLayer = i + 1; // 1-indexed
      schedule.push({
        spool: spoolIdx + 1,
        gramsAvailable: spoolWeights[spoolIdx],
        gramsUsed: Math.round(spoolGramsUsed * 10) / 10,
        purgeGrams: Math.round(purgeGrams * 10) / 10,
        startLayer: spoolStartLayer,
        endLayer: pauseLayer - 1,
        // EufyMake marker goes on the FIRST LAYER OF THE NEXT SPOOL
        // because EufyMake pauses BEFORE printing the marked layer
        pauseBeforeLayer: pauseLayer,
      });

      spoolIdx++;
      if (spoolIdx >= spoolWeights.length) break;
      spoolRemaining = spoolWeights[spoolIdx] - purgeGrams;
      spoolStartLayer = pauseLayer;
      spoolGramsUsed = 0;
    }

    spoolRemaining -= layerG;
    spoolGramsUsed += layerG;
  }

  // Final spool
  if (spoolIdx < spoolWeights.length) {
    schedule.push({
      spool: spoolIdx + 1,
      gramsAvailable: spoolWeights[spoolIdx],
      gramsUsed: Math.round(spoolGramsUsed * 10) / 10,
      purgeGrams: Math.round(purgeGrams * 10) / 10,
      startLayer: spoolStartLayer,
      endLayer: totalLayers,
      pauseBeforeLayer: null,
    });
  }

  return schedule;
}
```

---

## EufyMake Studio Integration Notes

When displaying swap points to the user:

1. **The marker layer is the first layer of the NEXT spool**, not the last layer of the current one.
2. EufyMake pauses **before** printing the marked layer.
3. To set a marker: drag the vertical slider on the right side of the preview to the layer, then click the `+` button.
4. The quick reference section should clearly say "Set marker on layer X" with the correct layer number.
5. Include a footnote: "EufyMake pauses before printing the marked layer — set the marker on the first layer of the next spool."

---

## Material Density Reference

| Material | Density (g/cm³) | Notes |
|----------|----------------|-------|
| PLA | 1.24 | Most common, default |
| PLA+ | 1.24 | Same density as PLA |
| PETG | 1.27 | Slightly heavier |
| ABS | 1.04 | Lighter |
| TPU | 1.21 | Flexible filament |
| ASA | 1.07 | UV-resistant |
| PC | 1.20 | Polycarbonate |
| HIPS | 1.04 | Support material |
| PVA | 1.23 | Water-soluble support |

Users should be able to select material type and have density auto-fill, or manually enter a custom density for specialty filaments.

---

## Testing the Parser

The parser should produce these results for the test file `cover_v13_1_0_2mm_AnkerMake_PLA__Basic_M5.gcode`:

| Metric | Expected Value | Source |
|--------|---------------|--------|
| Total layers | 45 | `;LAYER:` count |
| Total grams (parsed) | ~158.9g | Extrusion math |
| Header grams | 158.933g | `;Filament weight:` comment |
| Final total used | 158.9g | Header value (authoritative) |
| Extrusion mode | Relative (M83) | Line 231 of G-code |
| Total extrusion length | ~53,287.6mm | Sum of positive E on XY moves |

If the parser returns ~304g or ~90 layers, the bugs described in the Critical Parsing Rules section have resurfaced.
