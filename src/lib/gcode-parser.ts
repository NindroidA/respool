import { DEFAULT_FILAMENT_DIAMETER } from "@/lib/constants";
import {
  type SlicerProfile,
  type DetectionResult,
  type GcodeMetadata,
  detectSlicer,
  extractMetadata,
  convertToGrams,
  validateGcodeFile,
  SLICER_PROFILES,
} from "./slicer-profiles";

// ─── Types ──────────────────────────────────────────────

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
  metadata: GcodeMetadata;
  warnings: string[];
}

export interface ParseError {
  type: "validation" | "parse" | "no_layers" | "no_extrusion";
  message: string;
}

// ─── Main Parser ────────────────────────────────────────

/**
 * Parse G-code text and extract per-layer filament extrusion data.
 * Runs entirely client-side — no G-code data is sent to the server.
 *
 * Supports auto-detection of slicer type, or accepts a manual override.
 * See docs/GCODE_PARSER.md for parsing rules per slicer.
 */
export function parseGcode(
  text: string,
  density: number,
  options?: {
    slicerOverride?: SlicerProfile;
    diameter?: number;
    fileName?: string;
  },
): ParseResult | ParseError {
  const fileName = options?.fileName ?? "unknown.gcode";
  const diameter = options?.diameter ?? DEFAULT_FILAMENT_DIAMETER;
  const warnings: string[] = [];

  // Validate file content
  const validation = validateGcodeFile(text, fileName);
  if (!validation.valid) {
    return { type: "validation", message: validation.error! };
  }
  if (validation.warning) {
    warnings.push(validation.warning);
  }

  // Detect slicer or use override
  const metadata = extractMetadata(text);
  const profile = options?.slicerOverride ?? metadata.slicer.profile;

  // Use detected density/diameter if available and not overridden
  const effectiveDensity = metadata.density ?? density;
  const effectiveDiameter = metadata.diameter ?? diameter;

  if (metadata.density && metadata.density !== density) {
    warnings.push(
      `Density auto-detected from G-code: ${metadata.density} g/cm³ (${metadata.material ?? "unknown material"})`,
    );
  }

  if (metadata.isMultiMaterial) {
    warnings.push(
      `Multi-material print detected (${metadata.toolChangeCount} tool changes). If using AMS, filament swaps are handled automatically.`,
    );
  }

  if (metadata.slicer.confidence === "low") {
    warnings.push(
      "Could not identify the slicer. Using generic parsing — results may be less accurate. Consider selecting your slicer manually.",
    );
  }

  // Parse layers
  const result = parseWithProfile(
    text,
    profile,
    effectiveDensity,
    effectiveDiameter,
    warnings,
  );

  if ("type" in result) return result;

  return { ...result, metadata, warnings };
}

// ─── Profile-Based Parsing ──────────────────────────────

function parseWithProfile(
  text: string,
  profile: SlicerProfile,
  density: number,
  diameter: number,
  warnings: string[],
): Omit<ParseResult, "metadata" | "warnings"> | ParseError {
  const lines = text.split("\n");
  const filamentArea = Math.PI * (diameter / 2) ** 2;

  const rawLayers: { layer: number; extrusion: number }[] = [];
  let currentLayer = -1;
  let layerExtrusion = 0;
  let isRelative = false;
  let lastE = 0;
  let headerGrams: number | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Extract weight from header comments using profile patterns
    if (headerGrams === null) {
      for (const wp of profile.weightPatterns) {
        const match = line.match(wp.pattern);
        if (match) {
          const value = parseFloat(match[1]);
          if (!isNaN(value) && value > 0) {
            headerGrams = convertToGrams(value, wp.unit, density, diameter);
            break;
          }
        }
      }
    }

    // Extrusion mode — universal across all slicers
    if (/^M83\b/.test(line)) isRelative = true;
    if (/^M82\b/.test(line)) isRelative = false;

    // Layer detection — profile-specific pattern
    const isLayerChange = profile.layerMarker.test(line);

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

  // Error: no layers found
  if (rawLayers.length === 0) {
    return {
      type: "no_layers",
      message:
        "No layer markers found in the G-code. This may not be a sliced file, or the slicer format isn't recognized. Try selecting your slicer manually.",
    };
  }

  // Convert mm of extrusion to grams
  const gramsLayers = rawLayers.map((l) => ({
    ...l,
    grams: (l.extrusion * filamentArea * density) / 1000,
  }));

  const parsedGrams = gramsLayers.reduce((sum, l) => sum + l.grams, 0);

  // Error: no extrusion
  if (parsedGrams <= 0) {
    return {
      type: "no_extrusion",
      message:
        "Layers were detected but no filament extrusion found. The file may be a travel-only test or uses an unsupported extrusion format.",
    };
  }

  // Use slicer header weight as truth if available, scale proportionally
  const totalGrams = headerGrams ?? parsedGrams;

  // Warn if there's a large mismatch between parsed and header
  if (headerGrams !== null && parsedGrams > 0) {
    const mismatchPct = Math.abs(headerGrams - parsedGrams) / headerGrams;
    if (mismatchPct > 0.05) {
      warnings.push(
        `Parsed weight (${parsedGrams.toFixed(1)}g) differs from slicer-reported weight (${headerGrams.toFixed(1)}g) by ${(mismatchPct * 100).toFixed(0)}%. Using slicer value as authoritative.`,
      );
    }
  }

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

// ─── Re-exports for Convenience ─────────────────────────

export {
  detectSlicer,
  extractMetadata,
  validateGcodeFile,
  SLICER_PROFILES,
  type SlicerProfile,
  type SlicerId,
  type DetectionResult,
  type GcodeMetadata,
} from "./slicer-profiles";
