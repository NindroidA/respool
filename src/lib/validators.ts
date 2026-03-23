import { z } from "zod/v4";

export const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    email: z.email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const createSpoolSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  brand: z.string().min(1, "Brand is required").max(200),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  material: z.string().min(1, "Material is required"),
  currentMass: z.coerce.number().int().min(0, "Must be 0 or more"),
  startingMass: z.coerce.number().int().min(1, "Must be at least 1g"),
  diameter: z.coerce.number().positive().optional(),
  printingTemperature: z.coerce.number().int().positive().optional(),
  cost: z.coerce.number().int().min(0).optional(),
  note: z.string().max(2000).optional().default(""),
  boxId: z.string().optional().nullable(),
  filamentColorId: z.string().optional().nullable(),
});

export const updateSpoolSchema = createSpoolSchema.partial();

export const logUsageSchema = z.object({
  gramsUsed: z.coerce.number().int().min(1, "Must use at least 1g"),
  note: z.string().max(500).optional(),
});

export const createBoxSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
});

export const createPrintSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  notes: z.string().max(2000).optional(),
  status: z.enum(["planned", "in_progress", "completed"]).default("completed"),
  printTimeMinutes: z.coerce.number().int().min(0).optional(),
  estimatedGrams: z.coerce.number().int().min(0).optional(),
  estimatedLayers: z.coerce.number().int().min(0).optional(),
  filaments: z.array(
    z.object({
      spoolId: z.string().min(1),
      gramsUsed: z.coerce.number().int().min(1),
    })
  ).min(1, "At least one spool is required"),
});

export const userSettingsSchema = z.object({
  materialOptions: z.array(z.string()).min(1),
  dateFormat: z.enum(["MM/dd/yyyy", "dd/MM/yyyy", "yyyy-MM-dd"]),
  timeFormat: z.enum(["12h", "24h"]),
  defaultMaterial: z.string().min(1),
  defaultMass: z.coerce.number().int().min(1),
  unitPreference: z.enum(["grams", "oz"]),
  lowFilamentThreshold: z.coerce.number().int().min(0),
});
