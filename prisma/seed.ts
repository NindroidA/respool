import { PrismaClient } from "@prisma/client";
import { FILAMENT_COLORS } from "../src/lib/filament-colors";

const prisma = new PrismaClient();

async function main() {
  for (const color of FILAMENT_COLORS) {
    await prisma.filamentColor.upsert({
      where: {
        name_category: { name: color.name, category: color.category },
      },
      update: {
        hex: color.hex,
        hexSecondary: color.hexSecondary ?? null,
        sortOrder: color.sortOrder,
      },
      create: {
        name: color.name,
        hex: color.hex,
        hexSecondary: color.hexSecondary ?? null,
        category: color.category,
        sortOrder: color.sortOrder,
      },
    });
  }

  console.log(`Seeded ${FILAMENT_COLORS.length} filament colors`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
