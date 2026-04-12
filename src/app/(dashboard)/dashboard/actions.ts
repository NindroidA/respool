"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";

export async function getDashboardData() {
  const user = await requireUser();
  const userId = user.id;

  const [spools, logs, prints, settings] = await Promise.all([
    prisma.spool.findMany({
      where: { userId, archived: false },
      orderBy: { lastUsed: "desc" },
    }),
    prisma.spoolLog.findMany({
      where: { spool: { userId } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { spool: { select: { name: true } } },
    }),
    prisma.print.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const threshold = settings?.lowFilamentThreshold ?? 100;

  const totalSpools = spools.length;
  const totalAvailable = spools.reduce((sum, s) => sum + s.currentMass, 0);
  const totalUsed = logs.reduce((sum, l) => sum + l.gramsUsed, 0);
  const totalStarting = spools.reduce((sum, s) => sum + s.startingMass, 0);
  const avgUtilization =
    totalStarting > 0
      ? Math.round(((totalStarting - totalAvailable) / totalStarting) * 100)
      : 0;

  const materialMap = new Map<string, number>();
  for (const spool of spools) {
    materialMap.set(
      spool.material,
      (materialMap.get(spool.material) ?? 0) + spool.currentMass,
    );
  }
  const materialData = Array.from(materialMap.entries())
    .map(([material, grams]) => ({ material, grams }))
    .sort((a, b) => b.grams - a.grams);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const recentLogs = logs.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo);

  const weekMap = new Map<string, number>();
  for (const log of recentLogs) {
    const d = new Date(log.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    weekMap.set(key, (weekMap.get(key) ?? 0) + log.gramsUsed);
  }
  const usageData = Array.from(weekMap.entries())
    .map(([week, grams]) => ({ week, grams }))
    .reverse();

  const lowSpools = spools
    .filter((s) => s.currentMass <= threshold && s.currentMass > 0)
    .sort((a, b) => a.currentMass - b.currentMass);

  const recentlyUsed = spools
    .filter((s) => s.lastUsed !== null)
    .sort(
      (a, b) =>
        new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime(),
    )
    .slice(0, 4);

  const activities = [
    ...logs.slice(0, 10).map((l) => ({
      id: l.id,
      type: "log" as const,
      description: `Used ${l.gramsUsed}g from ${l.spool.name}`,
      timestamp: l.createdAt,
    })),
    ...prints.slice(0, 5).map((p) => ({
      id: p.id,
      type: "print" as const,
      description: `Print: ${p.name} (${p.totalGramsUsed}g)`,
      timestamp: p.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 10);

  return {
    totalSpools,
    totalAvailable,
    totalUsed,
    avgUtilization,
    materialData,
    usageData,
    lowSpools,
    recentlyUsed,
    activities,
  };
}
