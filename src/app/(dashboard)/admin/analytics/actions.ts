"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function getAnalytics() {
  await requireAdmin();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    dailyActiveUsers,
    userEngagement,
    spoolsByMaterial,
    totalFilament,
    topUsers,
  ] = await Promise.all([
    prisma.session.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true, createdAt: true },
    }),
    prisma.auditLog.groupBy({
      by: ["category"],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      orderBy: { _count: { category: "desc" } },
    }),
    prisma.spool.groupBy({
      by: ["material"],
      where: { archived: false },
      _count: true,
      orderBy: { _count: { material: "desc" } },
    }),
    prisma.spoolLog.aggregate({
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { gramsUsed: true },
    }),
    prisma.auditLog.groupBy({
      by: ["userId", "userName"],
      where: { createdAt: { gte: sevenDaysAgo }, userId: { not: null } },
      _count: true,
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
  ]);

  // DAU by day
  const dauByDay: Record<string, Set<string>> = {};
  for (const s of dailyActiveUsers) {
    const day = s.createdAt.toISOString().slice(0, 10);
    if (!dauByDay[day]) dauByDay[day] = new Set();
    dauByDay[day].add(s.userId);
  }

  return {
    dauByDay: Object.entries(dauByDay)
      .map(([day, users]) => ({ day: day.slice(5), count: users.size }))
      .sort((a, b) => a.day.localeCompare(b.day)),
    userEngagement: userEngagement.map((e) => ({
      category: e.category,
      count: e._count,
    })),
    spoolsByMaterial: spoolsByMaterial.map((s) => ({
      material: s.material,
      count: s._count,
    })),
    filamentUsed30d: totalFilament._sum.gramsUsed ?? 0,
    topUsers: topUsers.map((u) => ({
      name: u.userName ?? "Unknown",
      count: u._count,
    })),
  };
}
