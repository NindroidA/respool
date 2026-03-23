"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { userSettingsSchema } from "@/lib/validators";

async function requireUser() {
  const session = await getSession(await headers());
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function getSettings() {
  const user = await requireUser();

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (settings) return settings;

  // Create default settings if none exist
  return prisma.userSettings.create({
    data: { userId: user.id },
  });
}

export async function updateSettings(data: {
  materialOptions: string[];
  dateFormat: string;
  timeFormat: string;
  defaultMaterial: string;
  defaultMass: number;
  unitPreference: string;
  lowFilamentThreshold: number;
}) {
  const user = await requireUser();
  const validated = userSettingsSchema.parse(data);

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: validated,
    create: { userId: user.id, ...validated },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function addMaterial(material: string) {
  const user = await requireUser();
  const trimmed = material.trim().toUpperCase();
  if (!trimmed) throw new Error("Material name is required");

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  const current = settings?.materialOptions ?? [];
  if (current.includes(trimmed)) throw new Error("Material already exists");

  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: { materialOptions: [...current, trimmed] },
    create: { userId: user.id, materialOptions: [...current, trimmed] },
  });

  revalidatePath("/settings");
}

export async function removeMaterial(material: string) {
  const user = await requireUser();

  // Check if any spools use this material
  const spoolCount = await prisma.spool.count({
    where: { userId: user.id, material },
  });

  if (spoolCount > 0) {
    throw new Error(`Cannot remove — ${spoolCount} spool(s) use ${material}`);
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  const current = settings?.materialOptions ?? [];
  const updated = current.filter((m) => m !== material);

  if (updated.length === 0) throw new Error("Must have at least one material");

  await prisma.userSettings.update({
    where: { userId: user.id },
    data: { materialOptions: updated },
  });

  revalidatePath("/settings");
}
