import { describe, it, expect } from "vitest";
import {
  DEFAULT_LABEL_FIELDS,
  TEMPLATE_SIZES,
  type LabelTemplate,
  type LabelFields,
} from "@/components/labels/label-types";

describe("TEMPLATE_SIZES", () => {
  it("has all 4 templates", () => {
    const templates: LabelTemplate[] = ["compact", "standard", "detailed", "minimal"];
    for (const t of templates) {
      expect(TEMPLATE_SIZES[t]).toBeDefined();
      expect(TEMPLATE_SIZES[t].width).toBeGreaterThan(0);
      expect(TEMPLATE_SIZES[t].height).toBeGreaterThan(0);
      expect(TEMPLATE_SIZES[t].label).toBeTruthy();
    }
  });

  it("sizes are in ascending order (minimal < compact < standard < detailed)", () => {
    expect(TEMPLATE_SIZES.minimal.width).toBeLessThan(TEMPLATE_SIZES.compact.width);
    expect(TEMPLATE_SIZES.compact.width).toBeLessThan(TEMPLATE_SIZES.standard.width);
    expect(TEMPLATE_SIZES.standard.width).toBeLessThan(TEMPLATE_SIZES.detailed.width);
  });
});

describe("DEFAULT_LABEL_FIELDS", () => {
  it("has essential fields enabled by default", () => {
    expect(DEFAULT_LABEL_FIELDS.spoolNumber).toBe(true);
    expect(DEFAULT_LABEL_FIELDS.name).toBe(true);
    expect(DEFAULT_LABEL_FIELDS.brand).toBe(true);
    expect(DEFAULT_LABEL_FIELDS.material).toBe(true);
    expect(DEFAULT_LABEL_FIELDS.colorSwatch).toBe(true);
    expect(DEFAULT_LABEL_FIELDS.currentMass).toBe(true);
    expect(DEFAULT_LABEL_FIELDS.printTemp).toBe(true);
  });

  it("has optional fields disabled by default", () => {
    expect(DEFAULT_LABEL_FIELDS.colorName).toBe(false);
    expect(DEFAULT_LABEL_FIELDS.startingMass).toBe(false);
    expect(DEFAULT_LABEL_FIELDS.bedTemp).toBe(false);
    expect(DEFAULT_LABEL_FIELDS.diameter).toBe(false);
    expect(DEFAULT_LABEL_FIELDS.box).toBe(false);
    expect(DEFAULT_LABEL_FIELDS.cost).toBe(false);
  });

  it("all fields are booleans", () => {
    for (const [, value] of Object.entries(DEFAULT_LABEL_FIELDS)) {
      expect(typeof value).toBe("boolean");
    }
  });
});
