"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPrintSchema } from "@/lib/validators";

async function requireUser() {
  const session = await getSession(await headers());
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function getPrints(filters?: {
  search?: string;
  status?: string;
}) {
  const user = await requireUser();

  const where: Record<string, unknown> = { userId: user.id };

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters?.status && filters.status !== "all") {
    where.status = filters.status;
  }

  return prisma.print.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      filaments: {
        include: {
          spool: {
            select: {
              id: true,
              name: true,
              color: true,
              material: true,
            },
          },
        },
      },
    },
  });
}

export async function createPrint(data: {
  name: string;
  notes?: string;
  status: string;
  printTimeMinutes?: number;
  estimatedGrams?: number;
  estimatedLayers?: number;
  filaments: { spoolId: string; gramsUsed: number }[];
}) {
  const user = await requireUser();

  const validated = createPrintSchema.parse(data);
  const totalGrams = validated.filaments.reduce(
    (sum, f) => sum + f.gramsUsed,
    0,
  );

  // Verify all spools belong to user and have enough mass
  for (const filament of validated.filaments) {
    const spool = await prisma.spool.findUnique({
      where: { id: filament.spoolId },
    });
    if (!spool || spool.userId !== user.id) throw new Error("Spool not found");
    if (filament.gramsUsed > spool.currentMass) {
      throw new Error(
        `Not enough filament on ${spool.name} (${spool.currentMass}g remaining)`,
      );
    }
  }

  // Create print + filament records + spool logs in a transaction
  const print = await prisma.$transaction(async (tx) => {
    const newPrint = await tx.print.create({
      data: {
        name: validated.name,
        notes: validated.notes ?? null,
        status: validated.status,
        printTimeMinutes: validated.printTimeMinutes ?? null,
        estimatedGrams: validated.estimatedGrams ?? null,
        estimatedLayers: validated.estimatedLayers ?? null,
        totalGramsUsed: totalGrams,
        userId: user.id,
        filaments: {
          create: validated.filaments.map((f) => ({
            spoolId: f.spoolId,
            gramsUsed: f.gramsUsed,
          })),
        },
      },
    });

    // Deduct from each spool and create log entries
    for (const filament of validated.filaments) {
      const spool = await tx.spool.findUniqueOrThrow({
        where: { id: filament.spoolId },
      });
      const newMass = Math.max(0, spool.currentMass - filament.gramsUsed);

      await tx.spoolLog.create({
        data: {
          spoolId: filament.spoolId,
          gramsUsed: filament.gramsUsed,
          note: `Print: ${validated.name}`,
          previousMass: spool.currentMass,
          newMass,
        },
      });

      await tx.spool.update({
        where: { id: filament.spoolId },
        data: {
          currentMass: newMass,
          lastUsed: new Date(),
          archived: newMass === 0 ? true : undefined,
        },
      });
    }

    return newPrint;
  });

  revalidatePath("/prints");
  revalidatePath("/spools");
  revalidatePath("/dashboard");
  return print;
}

const VALID_STATUSES = ["planned", "in_progress", "completed"] as const;

export async function updatePrintStatus(id: string, status: string) {
  const user = await requireUser();

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    throw new Error("Invalid status");
  }

  const print = await prisma.print.findUnique({ where: { id } });
  if (!print || print.userId !== user.id) throw new Error("Not found");

  await prisma.print.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/prints");
}

export async function deletePrint(id: string) {
  const user = await requireUser();

  const print = await prisma.print.findUnique({
    where: { id },
    include: { filaments: true },
  });
  if (!print || print.userId !== user.id) throw new Error("Not found");

  // Restore filament to spools
  await prisma.$transaction(async (tx) => {
    for (const filament of print.filaments) {
      await tx.spool.update({
        where: { id: filament.spoolId },
        data: {
          currentMass: { increment: filament.gramsUsed },
          archived: false,
        },
      });
    }

    await tx.print.delete({ where: { id } });
  });

  revalidatePath("/prints");
  revalidatePath("/spools");
  revalidatePath("/dashboard");
}

export async function getActiveSpools() {
  const user = await requireUser();

  return prisma.spool.findMany({
    where: { userId: user.id, archived: false },
    orderBy: { lastUsed: "desc" },
    select: {
      id: true,
      name: true,
      brand: true,
      color: true,
      material: true,
      currentMass: true,
      startingMass: true,
    },
  });
}

export async function getPrintStats() {
  const user = await requireUser();

  const [totalPrints, totalGrams, totalTime] = await Promise.all([
    prisma.print.count({ where: { userId: user.id } }),
    prisma.print.aggregate({
      where: { userId: user.id },
      _sum: { totalGramsUsed: true },
    }),
    prisma.print.aggregate({
      where: { userId: user.id, printTimeMinutes: { not: null } },
      _sum: { printTimeMinutes: true },
    }),
  ]);

  return {
    totalPrints,
    totalGrams: totalGrams._sum.totalGramsUsed ?? 0,
    totalMinutes: totalTime._sum.printTimeMinutes ?? 0,
  };
}
