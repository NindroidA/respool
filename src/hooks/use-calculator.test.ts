import { describe, it, expect } from "vitest";
import type { InventorySpool } from "./use-calculator";

// Test the types and logic that don't require React rendering
// Full hook testing would need renderHook from @testing-library/react

const mockSpools: InventorySpool[] = [
  {
    id: "spool-1",
    spoolNumber: 1,
    name: "White PLA",
    brand: "Hatchbox",
    material: "PLA",
    color: "#FFFFFF",
    currentMass: 800,
    startingMass: 1000,
  },
  {
    id: "spool-2",
    spoolNumber: 2,
    name: "Black PETG",
    brand: "eSUN",
    material: "PETG",
    color: "#000000",
    currentMass: 450,
    startingMass: 1000,
  },
  {
    id: "spool-3",
    spoolNumber: 3,
    name: "Red PLA",
    brand: "Polymaker",
    material: "PLA",
    color: "#FF0000",
    currentMass: 200,
    startingMass: 1000,
  },
];

describe("useCalculator types", () => {
  it("InventorySpool interface is well-formed", () => {
    const spool: InventorySpool = mockSpools[0];
    expect(spool.id).toBe("spool-1");
    expect(spool.spoolNumber).toBe(1);
    expect(spool.currentMass).toBeLessThanOrEqual(spool.startingMass);
  });

  it("spool array can be sorted by currentMass", () => {
    const sorted = [...mockSpools].sort((a, b) => a.currentMass - b.currentMass);
    expect(sorted[0].name).toBe("Red PLA"); // 200g
    expect(sorted[1].name).toBe("Black PETG"); // 450g
    expect(sorted[2].name).toBe("White PLA"); // 800g
  });

  it("spool array can be filtered by material", () => {
    const plaSpools = mockSpools.filter((s) => s.material === "PLA");
    expect(plaSpools.length).toBe(2);
  });

  it("available spools calculation is correct", () => {
    const selectedIds = new Set(["spool-1"]);
    const available = mockSpools.filter((s) => !selectedIds.has(s.id));
    expect(available.length).toBe(2);
    expect(available.find((s) => s.id === "spool-1")).toBeUndefined();
  });

  it("sort options produce correct ordering", () => {
    type SortOption = "least-first" | "most-first" | "name" | "custom";

    const sort = (spools: InventorySpool[], option: SortOption) => {
      const sorted = [...spools];
      switch (option) {
        case "least-first":
          sorted.sort((a, b) => a.currentMass - b.currentMass);
          break;
        case "most-first":
          sorted.sort((a, b) => b.currentMass - a.currentMass);
          break;
        case "name":
          sorted.sort((a, b) => a.name.localeCompare(b.name));
          break;
      }
      return sorted;
    };

    const leastFirst = sort(mockSpools, "least-first");
    expect(leastFirst[0].currentMass).toBe(200);

    const mostFirst = sort(mockSpools, "most-first");
    expect(mostFirst[0].currentMass).toBe(800);

    const byName = sort(mockSpools, "name");
    expect(byName[0].name).toBe("Black PETG");
  });
});
