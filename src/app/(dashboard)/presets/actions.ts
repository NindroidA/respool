"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { z } from "zod/v4";

const optionalPositiveNumber = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.coerce.number().positive().optional(),
);
const optionalPositiveInt = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : val),
  z.coerce.number().int().positive().optional(),
);

const presetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  brand: z.string().min(1, "Brand is required").max(200),
  material: z.string().min(1, "Material is required"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color"),
  colorSecondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
  filamentColorId: z.string().optional().nullable(),
  startingMass: z.coerce.number().int().min(1, "Must be at least 1g"),
  diameter: optionalPositiveNumber,
  printingTemperature: optionalPositiveInt,
  bedTemperature: optionalPositiveInt,
  purchaseLink: z.string().url().optional().nullable().or(z.literal("")),
  estimatedCost: optionalPositiveInt,
});

export async function getPresets(filters?: {
  search?: string;
  source?: "user" | "community" | "all";
}) {
  const user = await requireUser();

  const source = filters?.source ?? "all";

  const where: Record<string, unknown> =
    source === "community"
      ? { userId: null, source: "community" }
      : source === "user"
        ? { userId: user.id }
        : { OR: [{ userId: user.id }, { userId: null, source: "community" }] };

  if (filters?.search) {
    where.AND = [
      {
        OR: [
          { name: { contains: filters.search, mode: "insensitive" } },
          { brand: { contains: filters.search, mode: "insensitive" } },
          { material: { contains: filters.search, mode: "insensitive" } },
        ],
      },
    ];
  }

  return prisma.filamentPreset.findMany({
    where,
    orderBy: [{ timesUsed: "desc" }, { name: "asc" }],
    include: {
      filamentColor: { select: { id: true, name: true, category: true } },
    },
  });
}

export async function getPreset(id: string) {
  const user = await requireUser();
  const preset = await prisma.filamentPreset.findUnique({ where: { id } });
  if (!preset) throw new Error("Not found");
  if (preset.userId && preset.userId !== user.id) throw new Error("Not found");
  return preset;
}

export async function createPreset(data: FormData) {
  const user = await requireUser();
  const raw = Object.fromEntries(data);
  const validated = presetSchema.parse(raw);

  const preset = await prisma.filamentPreset.create({
    data: {
      ...validated,
      userId: user.id,
      source: "user",
      purchaseLink: validated.purchaseLink || null,
      colorSecondary: validated.colorSecondary || null,
      filamentColorId: validated.filamentColorId || null,
    },
  });

  revalidatePath("/presets");
  revalidatePath("/spools");
  return preset;
}

export async function updatePreset(id: string, data: FormData) {
  const user = await requireUser();

  const existing = await prisma.filamentPreset.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  const raw = Object.fromEntries(data);
  const validated = presetSchema.partial().parse(raw);

  const preset = await prisma.filamentPreset.update({
    where: { id },
    data: {
      ...validated,
      purchaseLink: validated.purchaseLink || null,
      colorSecondary: validated.colorSecondary || null,
      filamentColorId: validated.filamentColorId || null,
    },
  });

  revalidatePath("/presets");
  return preset;
}

export async function deletePreset(id: string) {
  const user = await requireUser();

  const existing = await prisma.filamentPreset.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  await prisma.filamentPreset.delete({ where: { id } });

  revalidatePath("/presets");
}

export async function suggestPresets(query: string) {
  const user = await requireUser();

  if (!query || query.length < 2) return [];

  return prisma.filamentPreset.findMany({
    where: {
      OR: [{ userId: user.id }, { userId: null, source: "community" }],
      AND: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { brand: { contains: query, mode: "insensitive" } },
          { material: { contains: query, mode: "insensitive" } },
        ],
      },
    },
    orderBy: [{ timesUsed: "desc" }, { name: "asc" }],
    take: 10,
  });
}

export async function importCommunityPreset(presetId: string) {
  const user = await requireUser();

  const community = await prisma.filamentPreset.findUnique({
    where: { id: presetId },
  });
  if (!community || community.source !== "community")
    throw new Error("Not found");

  const preset = await prisma.filamentPreset.create({
    data: {
      userId: user.id,
      name: community.name,
      source: "imported",
      brand: community.brand,
      material: community.material,
      color: community.color,
      colorSecondary: community.colorSecondary,
      filamentColorId: community.filamentColorId,
      startingMass: community.startingMass,
      diameter: community.diameter,
      printingTemperature: community.printingTemperature,
      bedTemperature: community.bedTemperature,
      purchaseLink: community.purchaseLink,
      estimatedCost: community.estimatedCost,
    },
  });

  revalidatePath("/presets");
  return preset;
}

export async function checkDuplicateCombo(
  brand: string,
  material: string,
  color: string,
) {
  const user = await requireUser();

  const [spoolCount, presetExists] = await Promise.all([
    prisma.spool.count({
      where: { userId: user.id, brand, material, color },
    }),
    prisma.filamentPreset.findFirst({
      where: { userId: user.id, brand, material, color },
    }),
  ]);

  return { spoolCount, hasPreset: !!presetExists };
}
