"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { audit } from "@/lib/audit";
import { z } from "zod/v4";

const colorSchema = z.object({
  name: z.string().min(1).max(100),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  hexSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  category: z.enum(["solid", "silk", "matte", "dual", "translucent", "glow", "marble"]),
  sortOrder: z.coerce.number().int().default(0),
});

export async function getFilamentColorsAdmin() {
  await requireAdmin();

  return prisma.filamentColor.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { spools: true } } },
  });
}

export async function createFilamentColor(data: FormData) {
  const admin = await requireAdmin();
  const raw = Object.fromEntries(data);
  const validated = colorSchema.parse(raw);

  const color = await prisma.filamentColor.create({
    data: {
      ...validated,
      hexSecondary: validated.hexSecondary || null,
    },
  });

  audit({
    user: { id: admin.id, email: admin.email, name: admin.name },
    action: "admin.color_created", category: "admin",
    targetType: "FilamentColor", targetId: color.id, targetName: color.name,
  });

  revalidatePath("/admin/content");
  return color;
}

export async function updateFilamentColor(id: string, data: FormData) {
  const admin = await requireAdmin();
  const raw = Object.fromEntries(data);
  const validated = colorSchema.partial().parse(raw);

  const color = await prisma.filamentColor.update({
    where: { id },
    data: {
      ...validated,
      hexSecondary: validated.hexSecondary || null,
    },
  });

  audit({
    user: { id: admin.id, email: admin.email, name: admin.name },
    action: "admin.color_updated", category: "admin",
    targetType: "FilamentColor", targetId: id, targetName: color.name,
  });

  revalidatePath("/admin/content");
  return color;
}

export async function deleteFilamentColor(id: string) {
  const admin = await requireAdmin();

  const color = await prisma.filamentColor.findUnique({
    where: { id },
    include: { _count: { select: { spools: true } } },
  });

  if (!color) throw new Error("Not found");
  if (color._count.spools > 0) {
    throw new Error(`Cannot delete: ${color._count.spools} spool(s) use this color`);
  }

  await prisma.filamentColor.delete({ where: { id } });

  audit({
    user: { id: admin.id, email: admin.email, name: admin.name },
    action: "admin.color_deleted", category: "admin", severity: "warning",
    targetType: "FilamentColor", targetId: id, targetName: color.name,
  });

  revalidatePath("/admin/content");
}

export async function getMaterialStats() {
  await requireAdmin();

  return prisma.spool.groupBy({
    by: ["material"],
    _count: true,
    _sum: { currentMass: true, startingMass: true },
    orderBy: { _count: { material: "desc" } },
  });
}
