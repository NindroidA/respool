export const MATERIAL_DENSITIES: Record<string, number> = {
  PLA: 1.24,
  "PLA+": 1.24,
  PETG: 1.27,
  ABS: 1.04,
  TPU: 1.21,
  ASA: 1.07,
  PC: 1.20,
  HIPS: 1.04,
  PVA: 1.23,
};

export const MATERIAL_COLORS: Record<string, { primary: string; light: string }> = {
  PLA: { primary: "#10b981", light: "#6ee7b7" },
  "PLA+": { primary: "#10b981", light: "#6ee7b7" },
  PETG: { primary: "#0ea5e9", light: "#7dd3fc" },
  ABS: { primary: "#ea580c", light: "#fdba74" },
  TPU: { primary: "#c026d3", light: "#f0abfc" },
  ASA: { primary: "#d97706", light: "#fde68a" },
  PC: { primary: "#64748b", light: "#cbd5e1" },
  HIPS: { primary: "#6366f1", light: "#a5b4fc" },
  PVA: { primary: "#06b6d4", light: "#67e8f9" },
};

export const DEFAULT_MATERIALS = ["PLA", "PETG", "ABS", "TPU", "ASA", "PC", "HIPS", "PVA"];

export const DEFAULT_SPOOL_MASS = 1000; // grams

export const DEFAULT_FILAMENT_DIAMETER = 1.75; // mm
