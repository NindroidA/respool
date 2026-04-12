"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { createBoxSchema } from "@/lib/validators";
import { audit } from "@/lib/audit";

export async function getBoxes() {
  const user = await requireUser();

  return prisma.box.findMany({
    where: { userId: user.id },
    orderBy: { displayOrder: "asc" },
    include: {
      spools: {
        where: { archived: false },
        select: {
          id: true,
          spoolNumber: true,
          name: true,
          color: true,
          material: true,
          currentMass: true,
          startingMass: true,
          brand: true,
        },
      },
    },
  });
}

export async function getBox(id: string) {
  const user = await requireUser();

  const box = await prisma.box.findUnique({
    where: { id },
    include: {
      spools: {
        where: { archived: false },
        orderBy: { displayOrder: "asc" },
        include: {
          box: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!box || box.userId !== user.id) throw new Error("Not found");
  return box;
}

export async function createBox(data: FormData) {
  const user = await requireUser();

  const raw = Object.fromEntries(data);
  const validated = createBoxSchema.parse(raw);

  const maxOrder = await prisma.box.aggregate({
    where: { userId: user.id },
    _max: { displayOrder: true },
  });

  const box = await prisma.box.create({
    data: {
      name: validated.name,
      userId: user.id,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });

  audit({
    user: { id: user.id, email: user.email, name: user.name },
    action: "box.create",
    category: "box",
    targetType: "Box",
    targetId: box.id,
    targetName: box.name,
  });

  revalidatePath("/boxes");
  return box;
}

export async function updateBox(id: string, data: FormData) {
  const user = await requireUser();

  const existing = await prisma.box.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  const raw = Object.fromEntries(data);
  const validated = createBoxSchema.parse(raw);

  const box = await prisma.box.update({
    where: { id },
    data: { name: validated.name },
  });

  revalidatePath("/boxes");
  revalidatePath(`/boxes/${id}`);
  return box;
}

export async function deleteBox(id: string) {
  const user = await requireUser();

  const existing = await prisma.box.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  // Unassign spools from this box
  await prisma.spool.updateMany({
    where: { boxId: id },
    data: { boxId: null },
  });

  await prisma.box.delete({ where: { id } });

  audit({
    user: { id: user.id, email: user.email, name: user.name },
    action: "box.delete",
    category: "box",
    severity: "warning",
    targetType: "Box",
    targetId: id,
    targetName: existing.name,
  });

  revalidatePath("/boxes");
  revalidatePath("/spools");
}

export async function moveSpoolToBox(spoolId: string, boxId: string | null) {
  const user = await requireUser();

  const spool = await prisma.spool.findUnique({ where: { id: spoolId } });
  if (!spool || spool.userId !== user.id) throw new Error("Not found");

  if (boxId) {
    const box = await prisma.box.findUnique({ where: { id: boxId } });
    if (!box || box.userId !== user.id) throw new Error("Box not found");
  }

  await prisma.spool.update({
    where: { id: spoolId },
    data: { boxId },
  });

  revalidatePath("/boxes");
  revalidatePath("/spools");
}

export async function getUnboxedSpools() {
  const user = await requireUser();

  return prisma.spool.findMany({
    where: { userId: user.id, boxId: null, archived: false },
    orderBy: { name: "asc" },
    select: {
      id: true,
      spoolNumber: true,
      name: true,
      color: true,
      material: true,
      currentMass: true,
      startingMass: true,
      brand: true,
    },
  });
}
