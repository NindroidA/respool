// Production seed script — plain Node.js (no bun, no TypeScript).
// Used by deploy workflow: docker exec respool-app node prisma/seed.cjs
// Idempotent — safe to run on every deploy.

const { PrismaClient } = require("@prisma/client");
const colors = require("./filament-colors.json");

const prisma = new PrismaClient();

async function main() {
  let created = 0;
  let updated = 0;

  for (const color of colors) {
    const result = await prisma.filamentColor.upsert({
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
    if (result) updated++;
  }

  console.log(`Seeded ${colors.length} filament colors (${created} new, ${updated - created} updated)`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
