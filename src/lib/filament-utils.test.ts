import { describe, it, expect } from "vitest";
import {
  mmToGrams,
  getDensity,
  calculateSwapPointsGcode,
  calculateSwapPointsLinear,
  colorDistance,
  areColorsSimilar,
  colorGroupName,
} from "./filament-utils";
import type { ParsedLayer } from "./gcode-parser";

// ─── mmToGrams ──────────────────────────────────────────

describe("mmToGrams", () => {
  it("converts mm of filament to grams with PLA density", () => {
    // 1000mm × π × (0.875)² = 2405.28 mm³ → 2.40528 cm³ × 1.24 = 2.983g
    const result = mmToGrams(1000, 1.24);
    expect(result).toBeCloseTo(2.983, 1);
  });

  it("returns 0 for 0mm", () => {
    expect(mmToGrams(0, 1.24)).toBe(0);
  });

  it("scales linearly with length", () => {
    const g100 = mmToGrams(100, 1.24);
    const g200 = mmToGrams(200, 1.24);
    expect(g200).toBeCloseTo(g100 * 2, 5);
  });

  it("scales linearly with density", () => {
    const pla = mmToGrams(1000, 1.24);
    const petg = mmToGrams(1000, 1.27);
    expect(petg / pla).toBeCloseTo(1.27 / 1.24, 3);
  });
});

// ─── getDensity ─────────────────────────────────────────

describe("getDensity", () => {
  it("returns correct density for known materials", () => {
    expect(getDensity("PLA")).toBe(1.24);
    expect(getDensity("PETG")).toBe(1.27);
    expect(getDensity("ABS")).toBe(1.04);
    expect(getDensity("TPU")).toBe(1.21);
  });

  it("falls back to PLA density for unknown materials", () => {
    expect(getDensity("UNKNOWN_MATERIAL")).toBe(1.24);
    expect(getDensity("")).toBe(1.24);
  });
});

// ─── calculateSwapPointsGcode ───────────────────────────

describe("calculateSwapPointsGcode", () => {
  // Helper: create uniform layers
  function makeLayers(count: number, gramsEach: number): ParsedLayer[] {
    let cum = 0;
    return Array.from({ length: count }, (_, i) => {
      cum += gramsEach;
      return { layer: i, grams: gramsEach, cumGrams: cum };
    });
  }

  it("single spool covers entire print — no swaps", () => {
    const layers = makeLayers(10, 5); // 50g total
    const result = calculateSwapPointsGcode(layers, [100], 2, 10);
    expect(result.enough).toBe(true);
    expect(result.numSwaps).toBe(0);
    expect(result.schedule.length).toBe(1);
    expect(result.schedule[0].pauseBeforeLayer).toBeNull();
    expect(result.schedule[0].startLayer).toBe(1);
    expect(result.schedule[0].endLayer).toBe(10);
  });

  it("two spools with swap needed", () => {
    const layers = makeLayers(10, 10); // 100g total
    // Spool 1: 60g, Spool 2: 60g, purge: 5g each
    const result = calculateSwapPointsGcode(layers, [60, 60], 5, 10);
    expect(result.enough).toBe(true);
    expect(result.numSwaps).toBe(1);
    expect(result.schedule.length).toBe(2);
    // Spool 1: 60g - 5g purge = 55g available → covers 5 layers (50g)
    expect(result.schedule[0].endLayer).toBe(5);
    expect(result.schedule[0].pauseBeforeLayer).toBe(6);
    expect(result.schedule[1].startLayer).toBe(6);
    expect(result.schedule[1].pauseBeforeLayer).toBeNull();
  });

  it("not enough filament", () => {
    const layers = makeLayers(10, 10); // 100g total
    const result = calculateSwapPointsGcode(layers, [30, 30], 5, 10);
    expect(result.enough).toBe(false);
    expect(result.totalNeeded).toBe(100);
    expect(result.totalAvailable).toBe(60);
  });

  it("accounts for purge waste in total", () => {
    const layers = makeLayers(5, 10); // 50g total
    const result = calculateSwapPointsGcode(layers, [100], 10, 5);
    // 1 spool, 1 load → 10g purge
    expect(result.totalPurgeWaste).toBe(10);
    expect(result.totalWithPurge).toBe(60); // 50 + 10
  });

  it("handles zero purge", () => {
    const layers = makeLayers(5, 10);
    const result = calculateSwapPointsGcode(layers, [60], 0, 5);
    expect(result.totalPurgeWaste).toBe(0);
    expect(result.numSwaps).toBe(0);
  });

  it("three spools with two swaps", () => {
    const layers = makeLayers(30, 5); // 150g
    // 3 spools of 60g each, purge 5g
    const result = calculateSwapPointsGcode(layers, [60, 60, 60], 5, 30);
    expect(result.enough).toBe(true);
    expect(result.numSwaps).toBe(2);
    expect(result.schedule.length).toBe(3);
  });
});

// ─── calculateSwapPointsLinear ──────────────────────────

describe("calculateSwapPointsLinear", () => {
  it("single spool covers entire print", () => {
    const result = calculateSwapPointsLinear(50, 100, [100], 5);
    expect(result.enough).toBe(true);
    expect(result.numSwaps).toBe(0);
    expect(result.mode).toBe("linear");
    expect(result.gramsPerLayer).toBeCloseTo(0.5, 2);
  });

  it("calculates correct grams per layer", () => {
    const result = calculateSwapPointsLinear(100, 200, [200], 0);
    expect(result.gramsPerLayer).toBeCloseTo(0.5, 2);
  });

  it("two spools with swap", () => {
    const result = calculateSwapPointsLinear(100, 100, [60, 60], 5);
    expect(result.enough).toBe(true);
    expect(result.numSwaps).toBe(1);
    expect(result.schedule.length).toBe(2);
    // Spool 1: 60-5 = 55g → 55 layers at 1g/layer
    expect(result.schedule[0].endLayer).toBe(55);
    expect(result.schedule[0].pauseBeforeLayer).toBe(56);
  });

  it("not enough filament", () => {
    const result = calculateSwapPointsLinear(200, 100, [50, 50], 10);
    expect(result.enough).toBe(false);
  });

  it("reports layers covered correctly when short", () => {
    const result = calculateSwapPointsLinear(100, 100, [40], 5);
    // 40-5 = 35g available, at 1g/layer → covers 35 layers
    expect(result.layersCovered).toBe(35);
    expect(result.enough).toBe(false);
  });
});

// ─── colorDistance ───────────────────────────────────────

describe("colorDistance", () => {
  it("same color has zero distance", () => {
    expect(colorDistance("#FF0000", "#FF0000")).toBe(0);
    expect(colorDistance("#000000", "#000000")).toBe(0);
  });

  it("black and white have large distance", () => {
    const d = colorDistance("#000000", "#FFFFFF");
    expect(d).toBeGreaterThan(50);
  });

  it("similar reds are close", () => {
    const d = colorDistance("#FF0000", "#EE1111");
    expect(d).toBeLessThan(15);
  });

  it("red and blue are far apart", () => {
    const d = colorDistance("#FF0000", "#0000FF");
    expect(d).toBeGreaterThan(50);
  });
});

// ─── areColorsSimilar ───────────────────────────────────

describe("areColorsSimilar", () => {
  it("identical colors are similar", () => {
    expect(areColorsSimilar("#FF0000", null, "#FF0000", null)).toBe(true);
  });

  it("very different colors are not similar", () => {
    expect(areColorsSimilar("#FF0000", null, "#0000FF", null)).toBe(false);
  });

  it("similar shades are grouped", () => {
    expect(areColorsSimilar("#FF0000", null, "#EE1111", null)).toBe(true);
  });

  it("one dual one solid never match", () => {
    expect(areColorsSimilar("#FF0000", "#00FF00", "#FF0000", null)).toBe(false);
  });

  it("matching dual colors are similar", () => {
    expect(
      areColorsSimilar("#FF0000", "#00FF00", "#EE1111", "#11EE11"),
    ).toBe(true);
  });
});

// ─── colorGroupName ─────────────────────────────────────

describe("colorGroupName", () => {
  it("names solid colors", () => {
    expect(colorGroupName("#FF0000", null)).toBe("Red");
    expect(colorGroupName("#FFFFFF", null)).toBe("White");
    expect(colorGroupName("#000000", null)).toBe("Black");
  });

  it("names dual colors with slash", () => {
    const name = colorGroupName("#FF0000", "#0000FF");
    expect(name).toContain("/");
    expect(name).toContain("Red");
    expect(name).toContain("Blue");
  });
});
