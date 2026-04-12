interface FilamentColorEntry {
  name: string;
  hex: string;
  hexSecondary?: string;
  category: string;
  sortOrder: number;
}

export const FILAMENT_COLORS: FilamentColorEntry[] = [
  // ─── Solid Colors ──────────────────────────────────────
  { name: "White", hex: "#FFFFFF", category: "solid", sortOrder: 1 },
  { name: "Black", hex: "#1A1A1A", category: "solid", sortOrder: 2 },
  { name: "Gray", hex: "#808080", category: "solid", sortOrder: 3 },
  { name: "Light Gray", hex: "#C0C0C0", category: "solid", sortOrder: 4 },
  { name: "Charcoal", hex: "#36454F", category: "solid", sortOrder: 5 },
  { name: "Red", hex: "#E53935", category: "solid", sortOrder: 6 },
  { name: "Dark Red", hex: "#8B0000", category: "solid", sortOrder: 7 },
  { name: "Orange", hex: "#FF6D00", category: "solid", sortOrder: 8 },
  { name: "Yellow", hex: "#FFD600", category: "solid", sortOrder: 9 },
  { name: "Lime Green", hex: "#76FF03", category: "solid", sortOrder: 10 },
  { name: "Green", hex: "#43A047", category: "solid", sortOrder: 11 },
  { name: "Dark Green", hex: "#1B5E20", category: "solid", sortOrder: 12 },
  { name: "Teal", hex: "#009688", category: "solid", sortOrder: 13 },
  { name: "Cyan", hex: "#00BCD4", category: "solid", sortOrder: 14 },
  { name: "Light Blue", hex: "#42A5F5", category: "solid", sortOrder: 15 },
  { name: "Blue", hex: "#1565C0", category: "solid", sortOrder: 16 },
  { name: "Navy", hex: "#0D1B2A", category: "solid", sortOrder: 17 },
  { name: "Purple", hex: "#7B1FA2", category: "solid", sortOrder: 18 },
  { name: "Lavender", hex: "#B39DDB", category: "solid", sortOrder: 19 },
  { name: "Pink", hex: "#EC407A", category: "solid", sortOrder: 20 },
  { name: "Hot Pink", hex: "#FF1493", category: "solid", sortOrder: 21 },
  { name: "Coral", hex: "#FF7043", category: "solid", sortOrder: 22 },
  { name: "Peach", hex: "#FFAB91", category: "solid", sortOrder: 23 },
  { name: "Brown", hex: "#5D4037", category: "solid", sortOrder: 24 },
  { name: "Tan", hex: "#D2B48C", category: "solid", sortOrder: 25 },
  { name: "Ivory", hex: "#FFFFF0", category: "solid", sortOrder: 26 },
  { name: "Beige", hex: "#F5F5DC", category: "solid", sortOrder: 27 },
  { name: "Olive", hex: "#808000", category: "solid", sortOrder: 28 },
  { name: "Maroon", hex: "#800000", category: "solid", sortOrder: 29 },
  { name: "Skin Tone Light", hex: "#FDDBB4", category: "solid", sortOrder: 30 },
  {
    name: "Skin Tone Medium",
    hex: "#C68642",
    category: "solid",
    sortOrder: 31,
  },

  // ─── Silk / Shimmer Colors ─────────────────────────────
  { name: "Silk Gold", hex: "#D4AF37", category: "silk", sortOrder: 1 },
  { name: "Silk Silver", hex: "#C0C0C0", category: "silk", sortOrder: 2 },
  { name: "Silk Copper", hex: "#B87333", category: "silk", sortOrder: 3 },
  { name: "Silk Bronze", hex: "#CD7F32", category: "silk", sortOrder: 4 },
  { name: "Silk Rose Gold", hex: "#B76E79", category: "silk", sortOrder: 5 },
  { name: "Silk Sapphire", hex: "#2F5496", category: "silk", sortOrder: 6 },
  { name: "Silk Emerald", hex: "#1B8A4E", category: "silk", sortOrder: 7 },
  { name: "Silk Ruby", hex: "#9B111E", category: "silk", sortOrder: 8 },
  { name: "Silk Champagne", hex: "#F7E7CE", category: "silk", sortOrder: 9 },
  { name: "Silk Amethyst", hex: "#9966CC", category: "silk", sortOrder: 10 },
  {
    name: "Silk Rainbow",
    hex: "#FF6B6B",
    hexSecondary: "#4ECDC4",
    category: "silk",
    sortOrder: 11,
  },

  // ─── Matte Colors ──────────────────────────────────────
  { name: "Matte Black", hex: "#212121", category: "matte", sortOrder: 1 },
  { name: "Matte White", hex: "#F0F0F0", category: "matte", sortOrder: 2 },
  { name: "Matte Gray", hex: "#757575", category: "matte", sortOrder: 3 },
  { name: "Matte Navy", hex: "#1A237E", category: "matte", sortOrder: 4 },
  { name: "Matte Dark Green", hex: "#2E7D32", category: "matte", sortOrder: 5 },
  { name: "Matte Red", hex: "#C62828", category: "matte", sortOrder: 6 },
  { name: "Matte Blue", hex: "#1565C0", category: "matte", sortOrder: 7 },
  { name: "Matte Olive", hex: "#6B6B2E", category: "matte", sortOrder: 8 },

  // ─── Dual-Color / Multi-Color ──────────────────────────
  {
    name: "Red-Gold",
    hex: "#E53935",
    hexSecondary: "#D4AF37",
    category: "dual",
    sortOrder: 1,
  },
  {
    name: "Blue-Green",
    hex: "#1565C0",
    hexSecondary: "#43A047",
    category: "dual",
    sortOrder: 2,
  },
  {
    name: "Purple-Pink",
    hex: "#7B1FA2",
    hexSecondary: "#EC407A",
    category: "dual",
    sortOrder: 3,
  },
  {
    name: "Black-Red",
    hex: "#1A1A1A",
    hexSecondary: "#E53935",
    category: "dual",
    sortOrder: 4,
  },
  {
    name: "Gold-Green",
    hex: "#D4AF37",
    hexSecondary: "#43A047",
    category: "dual",
    sortOrder: 5,
  },
  {
    name: "Blue-Purple",
    hex: "#1565C0",
    hexSecondary: "#7B1FA2",
    category: "dual",
    sortOrder: 6,
  },
  {
    name: "Sunset",
    hex: "#FF6D00",
    hexSecondary: "#E53935",
    category: "dual",
    sortOrder: 7,
  },
  {
    name: "Ocean",
    hex: "#00BCD4",
    hexSecondary: "#1565C0",
    category: "dual",
    sortOrder: 8,
  },

  // ─── Translucent Colors ────────────────────────────────
  { name: "Clear", hex: "#E8E8E8", category: "translucent", sortOrder: 1 },
  {
    name: "Translucent Blue",
    hex: "#64B5F6",
    category: "translucent",
    sortOrder: 2,
  },
  {
    name: "Translucent Green",
    hex: "#81C784",
    category: "translucent",
    sortOrder: 3,
  },
  {
    name: "Translucent Orange",
    hex: "#FFB74D",
    category: "translucent",
    sortOrder: 4,
  },
  {
    name: "Translucent Red",
    hex: "#EF9A9A",
    category: "translucent",
    sortOrder: 5,
  },
  {
    name: "Translucent Purple",
    hex: "#CE93D8",
    category: "translucent",
    sortOrder: 6,
  },

  // ─── Glow-in-the-Dark ──────────────────────────────────
  { name: "Glow Green", hex: "#76FF03", category: "glow", sortOrder: 1 },
  { name: "Glow Blue", hex: "#40C4FF", category: "glow", sortOrder: 2 },
  { name: "Glow Aqua", hex: "#64FFDA", category: "glow", sortOrder: 3 },

  // ─── Marble / Granite ──────────────────────────────────
  {
    name: "Marble White/Gray",
    hex: "#F5F5F5",
    hexSecondary: "#9E9E9E",
    category: "marble",
    sortOrder: 1,
  },
  {
    name: "Marble Black/White",
    hex: "#212121",
    hexSecondary: "#E0E0E0",
    category: "marble",
    sortOrder: 2,
  },
  {
    name: "Marble Rainbow",
    hex: "#FF6B6B",
    hexSecondary: "#4ECDC4",
    category: "marble",
    sortOrder: 3,
  },
  {
    name: "Wood Grain",
    hex: "#8D6E4C",
    hexSecondary: "#D2B48C",
    category: "marble",
    sortOrder: 4,
  },
];

// colorDistance was removed — use the CIE76 Delta-E version from filament-utils.ts
// which is more perceptually accurate.
