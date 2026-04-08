"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

/** Fetch active (non-archived) spools for the calculator spool picker. */
export async function getSpoolsForCalculator() {
  const user = await requireUser();

  const spools = await prisma.spool.findMany({
    where: { userId: user.id, archived: false },
    select: {
      id: true,
      spoolNumber: true,
      name: true,
      brand: true,
      material: true,
      color: true,
      currentMass: true,
      startingMass: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return spools;
}
