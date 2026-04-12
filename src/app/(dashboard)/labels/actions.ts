"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

export async function getLabelSpools() {
  const user = await requireUser();

  return prisma.spool.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { spoolNumber: "asc" },
    select: {
      id: true,
      shortId: true,
      spoolNumber: true,
      name: true,
      brand: true,
      material: true,
      color: true,
      colorSecondary: true,
      currentMass: true,
      startingMass: true,
      diameter: true,
      printingTemperature: true,
      bedTemperature: true,
      cost: true,
      box: { select: { name: true } },
      filamentColor: { select: { name: true, category: true } },
    },
  });
}
