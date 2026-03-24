import { DEFAULT_FILAMENT_DIAMETER, MATERIAL_DENSITIES } from "@/lib/constants";
import type { ParsedLayer } from "@/lib/gcode-parser";

/** Convert mm of extruded filament to grams given a material density (g/cm³). */
export function mmToGrams(mm: number, density: number): number {
  const area = Math.PI * (DEFAULT_FILAMENT_DIAMETER / 2) ** 2; // mm²
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
  const layersCovered = schedule.length > 0 ? schedule[schedule.length - 1].endLayer : 0;

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
  const layersCovered = schedule.length > 0 ? schedule[schedule.length - 1].endLayer : 0;

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
