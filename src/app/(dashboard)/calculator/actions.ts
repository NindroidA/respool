"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function requireUser() {
  const session = await getSession(await headers());
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

/** Fetch active (non-archived) spools for the calculator spool picker. */
export async function getSpoolsForCalculator() {
  const user = await requireUser();

  const spools = await prisma.spool.findMany({
    where: { userId: user.id, archived: false },
    select: {
      id: true,
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
