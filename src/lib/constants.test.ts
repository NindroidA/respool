import { describe, it, expect } from "vitest";
import {
  MATERIAL_DENSITIES,
  MATERIAL_COLORS,
  DEFAULT_MATERIALS,
  DEFAULT_SPOOL_MASS,
  DEFAULT_FILAMENT_DIAMETER,
  NINDROID_URL,
  FOOTER_LINKS,
} from "./constants";

describe("MATERIAL_DENSITIES", () => {
  it("has all default materials", () => {
    for (const mat of DEFAULT_MATERIALS) {
      expect(MATERIAL_DENSITIES[mat]).toBeDefined();
      expect(MATERIAL_DENSITIES[mat]).toBeGreaterThan(0);
      expect(MATERIAL_DENSITIES[mat]).toBeLessThan(5);
    }
  });

  it("PLA density is 1.24", () => {
    expect(MATERIAL_DENSITIES.PLA).toBe(1.24);
  });

  it("all densities are realistic (0.9 - 2.0 g/cm³)", () => {
    for (const [, density] of Object.entries(MATERIAL_DENSITIES)) {
      expect(density).toBeGreaterThan(0.9);
      expect(density).toBeLessThan(2.0);
    }
  });
});

describe("MATERIAL_COLORS", () => {
  it("has primary and light colors for each material", () => {
    for (const [, colors] of Object.entries(MATERIAL_COLORS)) {
      expect(colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(colors.light).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("DEFAULT_MATERIALS", () => {
  it("is a non-empty array", () => {
    expect(DEFAULT_MATERIALS.length).toBeGreaterThan(0);
  });

  it("includes common materials", () => {
    expect(DEFAULT_MATERIALS).toContain("PLA");
    expect(DEFAULT_MATERIALS).toContain("PETG");
    expect(DEFAULT_MATERIALS).toContain("ABS");
    expect(DEFAULT_MATERIALS).toContain("TPU");
  });
});

describe("defaults", () => {
  it("DEFAULT_SPOOL_MASS is 1000g", () => {
    expect(DEFAULT_SPOOL_MASS).toBe(1000);
  });

  it("DEFAULT_FILAMENT_DIAMETER is 1.75mm", () => {
    expect(DEFAULT_FILAMENT_DIAMETER).toBe(1.75);
  });
});

describe("NINDROID_URL", () => {
  it("is a valid HTTPS URL", () => {
    expect(NINDROID_URL).toMatch(/^https:\/\//);
  });
});

describe("FOOTER_LINKS", () => {
  it("has all required links", () => {
    expect(FOOTER_LINKS.github).toMatch(/^https:\/\//);
    expect(FOOTER_LINKS.coffee).toMatch(/^https:\/\//);
    expect(FOOTER_LINKS.contributing).toMatch(/^https:\/\//);
    expect(FOOTER_LINKS.changelog).toMatch(/^https:\/\//);
    expect(FOOTER_LINKS.issues).toMatch(/^https:\/\//);
    expect(FOOTER_LINKS.license).toMatch(/^https:\/\//);
  });
});
