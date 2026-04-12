import { describe, it, expect } from "vitest";
import { mainNavItems, toolNavItems, adminNavItems } from "./nav-items";

describe("mainNavItems", () => {
  it("has required navigation items", () => {
    const labels = mainNavItems.map((i) => i.label);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Spools");
    expect(labels).toContain("Boxes");
    expect(labels).toContain("Prints");
  });

  it("all items have href starting with /", () => {
    for (const item of mainNavItems) {
      expect(item.href).toMatch(/^\//);
    }
  });

  it("all items have an icon component", () => {
    for (const item of mainNavItems) {
      expect(item.icon).toBeDefined();
    }
  });
});

describe("toolNavItems", () => {
  it("includes Calculator and Settings", () => {
    const labels = toolNavItems.map((i) => i.label);
    expect(labels).toContain("Calculator");
    expect(labels).toContain("Settings");
  });

  it("includes Presets, Labels, and Reorder", () => {
    const labels = toolNavItems.map((i) => i.label);
    expect(labels).toContain("Presets");
    expect(labels).toContain("Labels");
    expect(labels).toContain("Reorder");
  });
});

describe("adminNavItems", () => {
  it("has Admin item with /admin href", () => {
    expect(adminNavItems.length).toBeGreaterThan(0);
    expect(adminNavItems[0].href).toBe("/admin");
    expect(adminNavItems[0].label).toBe("Admin");
  });
});

describe("all nav items", () => {
  it("have no duplicate hrefs", () => {
    const allItems = [...mainNavItems, ...toolNavItems, ...adminNavItems];
    const hrefs = allItems.map((i) => i.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it("have no duplicate labels", () => {
    const allItems = [...mainNavItems, ...toolNavItems, ...adminNavItems];
    const labels = allItems.map((i) => i.label);
    const unique = new Set(labels);
    expect(unique.size).toBe(labels.length);
  });
});
