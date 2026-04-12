export type LabelTemplate = "compact" | "standard" | "detailed" | "minimal";

export interface LabelFields {
  spoolNumber: boolean;
  name: boolean;
  brand: boolean;
  material: boolean;
  colorSwatch: boolean;
  colorName: boolean;
  startingMass: boolean;
  currentMass: boolean;
  printTemp: boolean;
  bedTemp: boolean;
  diameter: boolean;
  box: boolean;
  cost: boolean;
}

export const DEFAULT_LABEL_FIELDS: LabelFields = {
  spoolNumber: true,
  name: true,
  brand: true,
  material: true,
  colorSwatch: true,
  colorName: false,
  startingMass: false,
  currentMass: true,
  printTemp: true,
  bedTemp: false,
  diameter: false,
  box: false,
  cost: false,
};

export interface LabelSpool {
  id: string;
  shortId: string;
  spoolNumber: number;
  name: string;
  brand: string;
  material: string;
  color: string;
  colorSecondary: string | null;
  currentMass: number;
  startingMass: number;
  diameter: number | null;
  printingTemperature: number | null;
  bedTemperature: number | null;
  cost: number | null;
  box: { name: string } | null;
  filamentColor: { name: string; category: string } | null;
}

export const TEMPLATE_SIZES: Record<
  LabelTemplate,
  { width: number; height: number; label: string }
> = {
  compact: { width: 288, height: 180, label: '2" x 1.25"' },
  standard: { width: 432, height: 288, label: '3" x 2"' },
  detailed: { width: 576, height: 432, label: '4" x 3"' },
  minimal: { width: 216, height: 144, label: '1.5" x 1"' },
};
