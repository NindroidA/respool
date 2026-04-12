"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import {
  createSpoolSchema,
  updateSpoolSchema,
  logUsageSchema,
} from "@/lib/validators";
import type { Prisma } from "@prisma/client";
import { areColorsSimilar, colorGroupName } from "@/lib/filament-utils";
import { audit } from "@/lib/audit";

export async function getSpools(filters?: {
  material?: string;
  boxId?: string | null;
  archived?: boolean;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}) {
  const user = await requireUser();

  const where: Prisma.SpoolWhereInput = { userId: user.id };

  if (filters?.material) where.material = filters.material;
  if (filters?.boxId !== undefined) where.boxId = filters.boxId;
  if (filters?.archived !== undefined) where.archived = filters.archived;
  else where.archived = false; // default to non-archived

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { brand: { contains: filters.search, mode: "insensitive" } },
      { material: { contains: filters.search, mode: "insensitive" } },
      { note: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const ALLOWED_SORT_FIELDS = [
    "name",
    "brand",
    "material",
    "currentMass",
    "lastUsed",
    "createdAt",
  ];
  const sortField = ALLOWED_SORT_FIELDS.includes(filters?.sort ?? "")
    ? filters!.sort!
    : "createdAt";
  const sortOrder = filters?.order === "asc" ? "asc" : "desc";
  const orderBy: Prisma.SpoolOrderByWithRelationInput = {
    [sortField]: sortOrder,
  };

  return prisma.spool.findMany({
    where,
    orderBy,
    include: {
      box: { select: { id: true, name: true } },
      filamentColor: { select: { id: true, name: true, category: true } },
    },
  });
}

export async function getSpool(id: string) {
  const user = await requireUser();

  const spool = await prisma.spool.findUnique({
    where: { id },
    include: {
      box: { select: { id: true, name: true } },
      filamentColor: true,
      logs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!spool || spool.userId !== user.id) throw new Error("Not found");
  return spool;
}

export async function createSpool(data: FormData) {
  const user = await requireUser();

  const raw = Object.fromEntries(data);
  const validated = createSpoolSchema.parse(raw);

  const shortId = Math.random().toString(36).substring(2, 10);

  // Auto-box: if no box selected, find or create one based on color similarity
  let autoBoxId: string | null = validated.boxId || null;
  if (!autoBoxId) {
    autoBoxId = await findOrCreateColorBox(
      user.id,
      validated.color,
      validated.colorSecondary || null,
    );
  }

  // Atomic: assign spool number and increment user's counter in one transaction
  const spool = await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { nextSpoolNumber: true },
    });

    const spoolNumber = currentUser.nextSpoolNumber;

    await tx.user.update({
      where: { id: user.id },
      data: { nextSpoolNumber: spoolNumber + 1 },
    });

    return tx.spool.create({
      data: {
        ...validated,
        shortId,
        spoolNumber,
        userId: user.id,
        boxId: autoBoxId,
        filamentColorId: validated.filamentColorId || null,
        colorSecondary: validated.colorSecondary || null,
        note: validated.note ?? "",
      },
    });
  });

  audit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "spool.create",
    category: "spool",
    targetType: "Spool",
    targetId: spool.id,
    targetName: spool.name,
    metadata: {
      brand: validated.brand,
      material: validated.material,
      startingMass: validated.startingMass,
    },
  });

  revalidatePath("/spools");
  revalidatePath("/boxes");
  revalidatePath("/dashboard");
  return spool;
}

/** Find an existing box with similar-colored spools, or create a new one. */
async function findOrCreateColorBox(
  userId: string,
  color: string,
  colorSecondary: string | null,
): Promise<string> {
  // Get all user's boxes with their spools' colors
  const boxes = await prisma.box.findMany({
    where: { userId },
    include: {
      spools: {
        where: { archived: false },
        select: { color: true, colorSecondary: true },
        take: 10,
      },
    },
  });

  // Check each box for color similarity
  for (const box of boxes) {
    if (box.spools.length === 0) continue;
    // A box matches if ANY spool in it has a similar color
    const matches = box.spools.some((s) =>
      areColorsSimilar(color, colorSecondary, s.color, s.colorSecondary),
    );
    if (matches) return box.id;
  }

  // No matching box — create a new one named after the color
  const name = colorGroupName(color, colorSecondary);
  const newBox = await prisma.box.create({
    data: { userId, name },
  });

  return newBox.id;
}

export async function updateSpool(id: string, data: FormData) {
  const user = await requireUser();

  const existing = await prisma.spool.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  const raw = Object.fromEntries(data);
  const validated = updateSpoolSchema.parse(raw);

  const spool = await prisma.spool.update({
    where: { id },
    data: {
      ...validated,
      boxId: validated.boxId || null,
      filamentColorId: validated.filamentColorId || null,
    },
  });

  audit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "spool.update",
    category: "spool",
    targetType: "Spool",
    targetId: id,
    targetName: spool.name,
  });

  revalidatePath("/spools");
  revalidatePath(`/spools/${id}`);
  revalidatePath("/dashboard");
  return spool;
}

export async function deleteSpool(id: string) {
  const user = await requireUser();

  const existing = await prisma.spool.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  await prisma.spool.delete({ where: { id } });

  audit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "spool.delete",
    category: "spool",
    severity: "warning",
    targetType: "Spool",
    targetId: id,
    targetName: existing.name,
  });

  revalidatePath("/spools");
  revalidatePath("/dashboard");
}

export async function duplicateSpool(id: string) {
  const user = await requireUser();

  const existing = await prisma.spool.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  const shortId = Math.random().toString(36).substring(2, 10);

  const spool = await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { nextSpoolNumber: true },
    });

    const spoolNumber = currentUser.nextSpoolNumber;

    await tx.user.update({
      where: { id: user.id },
      data: { nextSpoolNumber: spoolNumber + 1 },
    });

    return tx.spool.create({
      data: {
        name: existing.name,
        brand: existing.brand,
        color: existing.color,
        colorSecondary: existing.colorSecondary,
        material: existing.material,
        note: existing.note,
        currentMass: existing.startingMass,
        startingMass: existing.startingMass,
        diameter: existing.diameter,
        printingTemperature: existing.printingTemperature,
        cost: existing.cost,
        filamentColorId: existing.filamentColorId,
        boxId: existing.boxId,
        shortId,
        spoolNumber,
        userId: user.id,
      },
    });
  });

  audit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "spool.duplicate",
    category: "spool",
    targetType: "Spool",
    targetId: spool.id,
    targetName: spool.name,
    metadata: { originalId: id },
  });

  revalidatePath("/spools");
  return spool;
}

export async function archiveSpool(id: string) {
  const user = await requireUser();

  const existing = await prisma.spool.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  await prisma.spool.update({
    where: { id },
    data: { archived: true },
  });

  audit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "spool.archive",
    category: "spool",
    targetType: "Spool",
    targetId: id,
    targetName: existing.name,
  });

  revalidatePath("/spools");
  revalidatePath("/dashboard");
}

export async function unarchiveSpool(id: string) {
  const user = await requireUser();

  const existing = await prisma.spool.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  await prisma.spool.update({
    where: { id },
    data: { archived: false },
  });

  audit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "spool.unarchive",
    category: "spool",
    targetType: "Spool",
    targetId: id,
    targetName: existing.name,
  });

  revalidatePath("/spools");
}

export async function logUsage(
  spoolId: string,
  data: { gramsUsed: number; note?: string },
) {
  const user = await requireUser();

  const validated = logUsageSchema.parse(data);

  const spool = await prisma.spool.findUnique({ where: { id: spoolId } });
  if (!spool || spool.userId !== user.id) throw new Error("Not found");

  if (validated.gramsUsed > spool.currentMass) {
    throw new Error("Cannot use more than remaining mass");
  }

  const newMass = spool.currentMass - validated.gramsUsed;

  await prisma.$transaction([
    prisma.spoolLog.create({
      data: {
        spoolId,
        gramsUsed: validated.gramsUsed,
        note: validated.note ?? null,
        previousMass: spool.currentMass,
        newMass,
      },
    }),
    prisma.spool.update({
      where: { id: spoolId },
      data: {
        currentMass: newMass,
        lastUsed: new Date(),
        archived: newMass === 0 ? true : undefined,
      },
    }),
  ]);

  audit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "spool.log_usage",
    category: "spool",
    targetType: "Spool",
    targetId: spoolId,
    targetName: spool.name,
    metadata: { gramsUsed: validated.gramsUsed, newMass },
  });

  revalidatePath("/spools");
  revalidatePath(`/spools/${spoolId}`);
  revalidatePath("/dashboard");
}

export async function getSpoolLogs(spoolId: string) {
  const user = await requireUser();

  const spool = await prisma.spool.findUnique({ where: { id: spoolId } });
  if (!spool || spool.userId !== user.id) throw new Error("Not found");

  return prisma.spoolLog.findMany({
    where: { spoolId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteLog(logId: string) {
  const user = await requireUser();

  const log = await prisma.spoolLog.findUnique({
    where: { id: logId },
    include: { spool: true },
  });

  if (!log || log.spool.userId !== user.id) throw new Error("Not found");

  await prisma.$transaction([
    prisma.spoolLog.delete({ where: { id: logId } }),
    prisma.spool.update({
      where: { id: log.spoolId },
      data: {
        currentMass: log.spool.currentMass + log.gramsUsed,
        archived: false, // un-archive if mass was restored
      },
    }),
  ]);

  audit({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    action: "spool.log_delete",
    category: "spool",
    severity: "warning",
    targetType: "Spool",
    targetId: log.spoolId,
    targetName: log.spool.name,
    metadata: { gramsRestored: log.gramsUsed },
  });

  revalidatePath("/spools");
  revalidatePath(`/spools/${log.spoolId}`);
  revalidatePath("/dashboard");
}

export async function getBoxesForSelect() {
  const user = await requireUser();
  return prisma.box.findMany({
    where: { userId: user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getFilamentColors() {
  await requireUser();
  return prisma.filamentColor.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
  });
}
