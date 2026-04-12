"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

export async function getLowStockSpools() {
  const user = await requireUser();

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { lowFilamentThreshold: true },
  });

  const threshold = settings?.lowFilamentThreshold ?? 100;

  const spools = await prisma.spool.findMany({
    where: {
      userId: user.id,
      archived: false,
      currentMass: { lte: threshold },
    },
    orderBy: { currentMass: "asc" },
    include: {
      box: { select: { name: true } },
      preset: { select: { purchaseLink: true, estimatedCost: true } },
    },
  });

  return { spools, threshold };
}

export async function getArchivedForRestock() {
  const user = await requireUser();

  return prisma.spool.findMany({
    where: {
      userId: user.id,
      archived: true,
      currentMass: 0,
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
    select: {
      id: true,
      spoolNumber: true,
      name: true,
      brand: true,
      material: true,
      color: true,
      startingMass: true,
      purchaseLink: true,
      purchasePrice: true,
      cost: true,
    },
  });
}

export async function getUsageRates(spoolIds: string[]) {
  const user = await requireUser();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const logs = await prisma.spoolLog.groupBy({
    by: ["spoolId"],
    where: {
      spoolId: { in: spoolIds },
      spool: { userId: user.id },
      createdAt: { gte: thirtyDaysAgo },
    },
    _sum: { gramsUsed: true },
  });

  const rates: Record<string, number> = {};
  for (const log of logs) {
    const totalGrams = log._sum.gramsUsed ?? 0;
    rates[log.spoolId] = totalGrams / 30; // grams per day
  }

  return rates;
}

export async function getReorderSuggestions() {
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
      purchaseLink: true,
      purchasePrice: true,
      cost: true,
    },
  });

  if (spools.length === 0) return [];

  const rates = await getUsageRates(spools.map((s) => s.id));

  return spools
    .map((spool) => {
      const rate = rates[spool.id] ?? 0;
      if (rate <= 0) return null;
      const daysLeft = spool.currentMass / rate;
      const predictedEmpty = new Date();
      predictedEmpty.setDate(predictedEmpty.getDate() + daysLeft);
      return { ...spool, usageRatePerDay: rate, daysLeft, predictedEmpty };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.daysLeft <= 30)
    .sort((a, b) => a.daysLeft - b.daysLeft);
}

export async function getCostAnalytics() {
  const user = await requireUser();

  const spools = await prisma.spool.findMany({
    where: { userId: user.id, cost: { not: null } },
    select: {
      brand: true,
      material: true,
      cost: true,
      startingMass: true,
      purchasePrice: true,
      createdAt: true,
    },
  });

  // Total spend
  const totalSpend = spools.reduce(
    (sum, s) => sum + (s.purchasePrice ?? s.cost ?? 0),
    0,
  );

  // Cost per gram by brand
  const byBrand: Record<string, { totalCost: number; totalMass: number }> = {};
  for (const s of spools) {
    const cost = s.purchasePrice ?? s.cost ?? 0;
    if (!byBrand[s.brand])
      byBrand[s.brand] = { totalCost: 0, totalMass: 0 };
    byBrand[s.brand].totalCost += cost;
    byBrand[s.brand].totalMass += s.startingMass;
  }

  // Cost per gram by material
  const byMaterial: Record<
    string,
    { totalCost: number; totalMass: number }
  > = {};
  for (const s of spools) {
    const cost = s.purchasePrice ?? s.cost ?? 0;
    if (!byMaterial[s.material])
      byMaterial[s.material] = { totalCost: 0, totalMass: 0 };
    byMaterial[s.material].totalCost += cost;
    byMaterial[s.material].totalMass += s.startingMass;
  }

  // Monthly spend (last 6 months)
  const monthlySpend: Record<string, number> = {};
  for (const s of spools) {
    const month = s.createdAt.toISOString().slice(0, 7); // YYYY-MM
    const cost = s.purchasePrice ?? s.cost ?? 0;
    monthlySpend[month] = (monthlySpend[month] ?? 0) + cost;
  }

  return {
    totalSpend,
    spoolCount: spools.length,
    avgPerSpool:
      spools.length > 0 ? Math.round(totalSpend / spools.length) : 0,
    costByBrand: Object.entries(byBrand)
      .map(([brand, data]) => ({
        brand,
        costPerGram:
          data.totalMass > 0 ? data.totalCost / data.totalMass / 100 : 0,
        totalSpend: data.totalCost,
      }))
      .sort((a, b) => a.costPerGram - b.costPerGram),
    costByMaterial: Object.entries(byMaterial)
      .map(([material, data]) => ({
        material,
        costPerGram:
          data.totalMass > 0 ? data.totalCost / data.totalMass / 100 : 0,
        totalSpend: data.totalCost,
      }))
      .sort((a, b) => a.costPerGram - b.costPerGram),
    monthlySpend: Object.entries(monthlySpend)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6),
  };
}

export async function getLowStockCount() {
  const user = await requireUser();

  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
    select: { lowFilamentThreshold: true },
  });

  const threshold = settings?.lowFilamentThreshold ?? 100;

  return prisma.spool.count({
    where: {
      userId: user.id,
      archived: false,
      currentMass: { lte: threshold },
    },
  });
}
