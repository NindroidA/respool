import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  createSpoolSchema,
  logUsageSchema,
  createBoxSchema,
  createPrintSchema,
  userSettingsSchema,
} from "./validators";

// ─── loginSchema ────────────────────────────────────────

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty fields", () => {
    expect(loginSchema.safeParse({ email: "", password: "" }).success).toBe(false);
  });
});

// ─── registerSchema ─────────────────────────────────────

describe("registerSchema", () => {
  it("accepts valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      name: "Test User",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "differentpass",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });
});

// ─── createSpoolSchema ──────────────────────────────────

describe("createSpoolSchema", () => {
  const validSpool = {
    name: "Generic White PLA",
    brand: "Hatchbox",
    color: "#FFFFFF",
    material: "PLA",
    currentMass: "1000",
    startingMass: "1000",
  };

  it("accepts valid spool data", () => {
    const result = createSpoolSchema.safeParse(validSpool);
    expect(result.success).toBe(true);
  });

  it("accepts optional fields", () => {
    const result = createSpoolSchema.safeParse({
      ...validSpool,
      diameter: "1.75",
      printingTemperature: "200",
      note: "Test note",
      boxId: "some-id",
    });
    expect(result.success).toBe(true);
  });

  it("coerces numeric strings to numbers", () => {
    const result = createSpoolSchema.safeParse(validSpool);
    if (!result.success) return;
    expect(result.data.currentMass).toBe(1000);
    expect(result.data.startingMass).toBe(1000);
  });

  it("rejects invalid hex color", () => {
    const result = createSpoolSchema.safeParse({
      ...validSpool,
      color: "not-a-color",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = createSpoolSchema.safeParse({
      ...validSpool,
      name: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative mass", () => {
    const result = createSpoolSchema.safeParse({
      ...validSpool,
      startingMass: "-1",
    });
    expect(result.success).toBe(false);
  });

  it("allows zero currentMass", () => {
    const result = createSpoolSchema.safeParse({
      ...validSpool,
      currentMass: "0",
    });
    expect(result.success).toBe(true);
  });

  it("handles empty optional number fields gracefully", () => {
    const result = createSpoolSchema.safeParse({
      ...validSpool,
      diameter: "",
      printingTemperature: "",
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.diameter).toBeUndefined();
    expect(result.data.printingTemperature).toBeUndefined();
  });
});

// ─── logUsageSchema ─────────────────────────────────────

describe("logUsageSchema", () => {
  it("accepts valid usage", () => {
    const result = logUsageSchema.safeParse({ gramsUsed: 50 });
    expect(result.success).toBe(true);
  });

  it("accepts usage with note", () => {
    const result = logUsageSchema.safeParse({
      gramsUsed: 25,
      note: "Phone case print",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero grams", () => {
    const result = logUsageSchema.safeParse({ gramsUsed: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative grams", () => {
    const result = logUsageSchema.safeParse({ gramsUsed: -10 });
    expect(result.success).toBe(false);
  });

  it("rejects overly long notes", () => {
    const result = logUsageSchema.safeParse({
      gramsUsed: 10,
      note: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

// ─── createBoxSchema ────────────────────────────────────

describe("createBoxSchema", () => {
  it("accepts valid box name", () => {
    expect(createBoxSchema.safeParse({ name: "Box A" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(createBoxSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects overly long name", () => {
    expect(createBoxSchema.safeParse({ name: "x".repeat(201) }).success).toBe(false);
  });
});

// ─── createPrintSchema ──────────────────────────────────

describe("createPrintSchema", () => {
  const validPrint = {
    name: "Phone Case",
    status: "completed",
    filaments: [{ spoolId: "spool-1", gramsUsed: 25 }],
  };

  it("accepts valid print", () => {
    const result = createPrintSchema.safeParse(validPrint);
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    for (const status of ["planned", "in_progress", "completed"]) {
      const result = createPrintSchema.safeParse({ ...validPrint, status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = createPrintSchema.safeParse({
      ...validPrint,
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty filaments array", () => {
    const result = createPrintSchema.safeParse({
      ...validPrint,
      filaments: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts multiple filaments", () => {
    const result = createPrintSchema.safeParse({
      ...validPrint,
      filaments: [
        { spoolId: "spool-1", gramsUsed: 25 },
        { spoolId: "spool-2", gramsUsed: 10 },
      ],
    });
    expect(result.success).toBe(true);
  });
});

// ─── userSettingsSchema ─────────────────────────────────

describe("userSettingsSchema", () => {
  const validSettings = {
    materialOptions: ["PLA", "PETG"],
    dateFormat: "MM/dd/yyyy",
    timeFormat: "12h",
    defaultMaterial: "PLA",
    defaultMass: 1000,
    unitPreference: "grams",
    lowFilamentThreshold: 100,
  };

  it("accepts valid settings", () => {
    expect(userSettingsSchema.safeParse(validSettings).success).toBe(true);
  });

  it("rejects empty materialOptions", () => {
    const result = userSettingsSchema.safeParse({
      ...validSettings,
      materialOptions: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid dateFormat", () => {
    const result = userSettingsSchema.safeParse({
      ...validSettings,
      dateFormat: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid date formats", () => {
    for (const fmt of ["MM/dd/yyyy", "dd/MM/yyyy", "yyyy-MM-dd"]) {
      expect(
        userSettingsSchema.safeParse({ ...validSettings, dateFormat: fmt }).success,
      ).toBe(true);
    }
  });

  it("accepts all valid time formats", () => {
    for (const fmt of ["12h", "24h"]) {
      expect(
        userSettingsSchema.safeParse({ ...validSettings, timeFormat: fmt }).success,
      ).toBe(true);
    }
  });
});
