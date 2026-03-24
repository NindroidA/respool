import { DEFAULT_FILAMENT_DIAMETER } from "@/lib/constants";

export interface ParsedLayer {
  layer: number;
  grams: number;
  cumGrams: number;
}

export interface ParseResult {
  layers: ParsedLayer[];
  totalGrams: number;
  totalLayers: number;
  headerGrams: number | null;
  parsedGrams: number;
}

/**
 * Parse G-code text and extract per-layer filament extrusion data.
 * Runs entirely client-side — no G-code data is sent to the server.
 *
 * Currently optimized for AnkerMake / EufyMake Studio G-code.
 * See docs/GCODE_PARSER.md for critical parsing rules.
 */
export function parseGcode(text: string, density: number): ParseResult {
  const lines = text.split("\n");
  const filamentArea = Math.PI * (DEFAULT_FILAMENT_DIAMETER / 2) ** 2;

  const rawLayers: { layer: number; extrusion: number }[] = [];
  let currentLayer = -1;
  let layerExtrusion = 0;
  let isRelative = false;
  let lastE = 0;
  let headerGrams: number | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Read slicer-reported weight from header comments
    const weightMatch =
      line.match(/^;Filament weight:\s*([\d.]+)\s*g/i) ||
      line.match(/^;\s*filament\s*used\s*\[g\]\s*=\s*([\d.]+)/i);
    if (weightMatch) headerGrams = parseFloat(weightMatch[1]);

    // Extrusion mode — word boundary for trailing comments (M83 ; comment)
    if (/^M83\b/.test(line)) isRelative = true;
    if (/^M82\b/.test(line)) isRelative = false;

    // Layer detection — ONLY ;LAYER:N (skip ;LAYER_CHANGE, Z-hops, arcs)
    const isLayerChange = /^;LAYER:\d+/i.test(line);

    if (isLayerChange && currentLayer >= 0) {
      rawLayers.push({ layer: currentLayer, extrusion: layerExtrusion });
      layerExtrusion = 0;
    }
    if (isLayerChange) currentLayer++;

    // Extrusion — only on G0/G1 moves with X or Y (filters retraction/unretraction)
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

    // E position reset (G92 E0)
    if (/^G92\s/.test(line) && /E0/.test(line)) lastE = 0;
  }

  // Push final layer
  if (currentLayer >= 0 && layerExtrusion > 0) {
    rawLayers.push({ layer: currentLayer, extrusion: layerExtrusion });
  }

  // Convert mm of extrusion to grams: volume = length × area (mm³), ÷1000 for cm³, × density
  const gramsLayers = rawLayers.map((l) => ({
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
