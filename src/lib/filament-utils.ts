import { DEFAULT_FILAMENT_DIAMETER, MATERIAL_DENSITIES } from "@/lib/constants";
import type { ParsedLayer } from "@/lib/gcode-parser";

/** Convert mm of extruded filament to grams given a material density (g/cm³). */
export function mmToGrams(
  mm: number,
  density: number,
  diameter: number = DEFAULT_FILAMENT_DIAMETER,
): number {
  const area = Math.PI * (diameter / 2) ** 2; // mm²
  return (mm * area * density) / 1000;
}

/** Get density for a material name, falling back to PLA. */
export function getDensity(material: string): number {
  return MATERIAL_DENSITIES[material] ?? MATERIAL_DENSITIES.PLA;
}

export interface SwapScheduleEntry {
  spool: number;
  gramsAvailable: number;
  gramsUsed: number;
  purgeGrams: number;
  startLayer: number;
  endLayer: number;
  /** Layer to set EufyMake marker on (null = final spool, no pause needed). */
  pauseBeforeLayer: number | null;
}

export interface SwapResult {
  mode: "gcode" | "linear";
  gramsPerLayer: number | null;
  totalAvailable: number;
  totalNeeded: number;
  totalWithPurge: number;
  totalPurgeWaste: number;
  purgePerSwap: number;
  numSwaps: number;
  enough: boolean;
  layersCovered: number;
  totalLayers: number;
  schedule: SwapScheduleEntry[];
}

/**
 * Calculate spool swap points using per-layer G-code data.
 * Each spool loses purgeGrams on load (initial load + each swap).
 */
export function calculateSwapPointsGcode(
  layers: ParsedLayer[],
  spoolWeights: number[],
  purgeGrams: number,
  totalLayers: number,
): SwapResult {
  const schedule: SwapScheduleEntry[] = [];
  let spoolIdx = 0;
  let spoolRemaining = spoolWeights[0] - purgeGrams;
  let spoolStartLayer = 1;
  let spoolGramsUsed = 0;
  let totalPurgeWaste = purgeGrams;

  for (let i = 0; i < layers.length; i++) {
    const layerG = layers[i].grams;

    if (layerG > spoolRemaining) {
      const pauseLayer = i + 1; // 1-indexed
      schedule.push({
        spool: spoolIdx + 1,
        gramsAvailable: spoolWeights[spoolIdx],
        gramsUsed: round1(spoolGramsUsed),
        purgeGrams: round1(purgeGrams),
        startLayer: spoolStartLayer,
        endLayer: pauseLayer - 1,
        pauseBeforeLayer: pauseLayer,
      });

      spoolIdx++;
      if (spoolIdx >= spoolWeights.length) break;
      spoolRemaining = spoolWeights[spoolIdx] - purgeGrams;
      totalPurgeWaste += purgeGrams;
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
      gramsUsed: round1(spoolGramsUsed),
      purgeGrams: round1(purgeGrams),
      startLayer: spoolStartLayer,
      endLayer: totalLayers,
      pauseBeforeLayer: null,
    });
  }

  const totalNeeded = layers.reduce((s, l) => s + l.grams, 0);
  const totalAvailable = spoolWeights.reduce((a, b) => a + b, 0);
  const layersCovered =
    schedule.length > 0 ? schedule[schedule.length - 1].endLayer : 0;

  return {
    mode: "gcode",
    gramsPerLayer: null,
    totalAvailable: round1(totalAvailable),
    totalNeeded: round1(totalNeeded),
    totalWithPurge: round1(totalNeeded + totalPurgeWaste),
    totalPurgeWaste: round1(totalPurgeWaste),
    purgePerSwap: round1(purgeGrams),
    numSwaps: schedule.filter((s) => s.pauseBeforeLayer !== null).length,
    enough: totalAvailable >= totalNeeded + totalPurgeWaste,
    layersCovered,
    totalLayers,
    schedule,
  };
}

/**
 * Calculate spool swap points using linear estimation (uniform grams/layer).
 * Used when no G-code is available — less accurate but still useful.
 */
export function calculateSwapPointsLinear(
  totalGrams: number,
  totalLayers: number,
  spoolWeights: number[],
  purgeGrams: number,
): SwapResult {
  const gramsPerLayer = totalGrams / totalLayers;
  const schedule: SwapScheduleEntry[] = [];
  let cumLayers = 0;
  let totalPurgeWaste = purgeGrams; // initial load

  for (let i = 0; i < spoolWeights.length; i++) {
    const effectiveG = spoolWeights[i] - purgeGrams;
    const layersThisSpool = Math.floor(Math.max(0, effectiveG) / gramsPerLayer);
    const startLayer = cumLayers + 1;
    const endLayer = Math.min(cumLayers + layersThisSpool, totalLayers);
    const actualGrams = (endLayer - cumLayers) * gramsPerLayer;

    schedule.push({
      spool: i + 1,
      gramsAvailable: spoolWeights[i],
      gramsUsed: round1(actualGrams),
      purgeGrams: round1(purgeGrams),
      startLayer,
      endLayer,
      pauseBeforeLayer: endLayer < totalLayers ? endLayer + 1 : null,
    });

    cumLayers = endLayer;
    if (cumLayers >= totalLayers) break;
    if (i < spoolWeights.length - 1) totalPurgeWaste += purgeGrams;
  }

  const totalAvailable = spoolWeights.reduce((a, b) => a + b, 0);
  const layersCovered =
    schedule.length > 0 ? schedule[schedule.length - 1].endLayer : 0;

  return {
    mode: "linear",
    gramsPerLayer: Math.round(gramsPerLayer * 100) / 100,
    totalAvailable: round1(totalAvailable),
    totalNeeded: round1(totalGrams),
    totalWithPurge: round1(totalGrams + totalPurgeWaste),
    totalPurgeWaste: round1(totalPurgeWaste),
    purgePerSwap: round1(purgeGrams),
    numSwaps: schedule.filter((s) => s.pauseBeforeLayer !== null).length,
    enough: totalAvailable >= totalGrams + totalPurgeWaste,
    layersCovered,
    totalLayers,
    schedule,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── Color Distance (CIE76 Delta-E in LAB space) ────────

/** Convert hex (#RRGGBB) to [R, G, B] in 0–255. */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert sRGB (0–255) to CIELAB [L, a, b]. */
function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  // sRGB → linear
  let rr = r / 255,
    gg = g / 255,
    bb = b / 255;
  rr = rr > 0.04045 ? ((rr + 0.055) / 1.055) ** 2.4 : rr / 12.92;
  gg = gg > 0.04045 ? ((gg + 0.055) / 1.055) ** 2.4 : gg / 12.92;
  bb = bb > 0.04045 ? ((bb + 0.055) / 1.055) ** 2.4 : bb / 12.92;
  // linear → XYZ (D65)
  let x = (rr * 0.4124564 + gg * 0.3575761 + bb * 0.1804375) / 0.95047;
  let y = rr * 0.2126729 + gg * 0.7151522 + bb * 0.072175;
  let z = (rr * 0.0193339 + gg * 0.119192 + bb * 0.9503041) / 1.08883;
  // XYZ → LAB
  const f = (t: number) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);
  x = f(x);
  y = f(y);
  z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

/** CIE76 Delta-E between two hex colors. Lower = more similar. <15 is very close. */
export function colorDistance(hex1: string, hex2: string): number {
  const lab1 = rgbToLab(...hexToRgb(hex1));
  const lab2 = rgbToLab(...hexToRgb(hex2));
  return Math.sqrt(
    (lab1[0] - lab2[0]) ** 2 +
      (lab1[1] - lab2[1]) ** 2 +
      (lab1[2] - lab2[2]) ** 2,
  );
}

/** Check if two spools have similar colors (handles dual-color). */
export function areColorsSimilar(
  color1: string,
  secondary1: string | null,
  color2: string,
  secondary2: string | null,
  threshold = 20,
): boolean {
  const bothDual = secondary1 && secondary2;
  const bothSolid = !secondary1 && !secondary2;

  if (bothSolid) {
    return colorDistance(color1, color2) < threshold;
  }
  if (bothDual) {
    // Both duals: compare primary-to-primary and secondary-to-secondary (or swapped)
    const d1 =
      colorDistance(color1, color2) + colorDistance(secondary1!, secondary2!);
    const d2 =
      colorDistance(color1, secondary2!) + colorDistance(secondary1!, color2);
    return Math.min(d1, d2) / 2 < threshold;
  }
  // One dual, one solid — don't group
  return false;
}

/** Generate a descriptive name for a color group. */
export function colorGroupName(
  hex: string,
  hexSecondary: string | null,
): string {
  const [r, g, b] = hexToRgb(hex);
  const name = closestColorName(r, g, b);
  if (hexSecondary) {
    const [r2, g2, b2] = hexToRgb(hexSecondary);
    const name2 = closestColorName(r2, g2, b2);
    return `${name} / ${name2}`;
  }
  return name;
}

const COLOR_NAMES: [string, number, number, number][] = [
  ["White", 255, 255, 255],
  ["Black", 0, 0, 0],
  ["Red", 220, 40, 40],
  ["Blue", 50, 80, 220],
  ["Green", 40, 180, 60],
  ["Yellow", 240, 220, 40],
  ["Orange", 240, 130, 30],
  ["Purple", 140, 50, 180],
  ["Pink", 240, 120, 160],
  ["Brown", 140, 80, 40],
  ["Gray", 140, 140, 140],
  ["Cyan", 40, 200, 200],
  ["Teal", 0, 140, 130],
  ["Gold", 200, 170, 50],
  ["Silver", 190, 190, 200],
  ["Navy", 30, 30, 100],
];

function closestColorName(r: number, g: number, b: number): string {
  let minDist = Infinity;
  let name = "Custom";
  for (const [n, cr, cg, cb] of COLOR_NAMES) {
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < minDist) {
      minDist = d;
      name = n;
    }
  }
  return name;
}
