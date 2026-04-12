"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function getAdminStats() {
  await requireAdmin();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    activeUsers,
    totalSpools,
    totalPrints,
    filamentUsed,
    activeSessions,
    recentActivity,
    usersWithout2FA,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.session.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { userId: true },
      distinct: ["userId"],
    }),
    prisma.spool.count({ where: { archived: false } }),
    prisma.print.count(),
    prisma.spoolLog.aggregate({ _sum: { gramsUsed: true } }),
    prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        action: true,
        category: true,
        severity: true,
        userName: true,
        userEmail: true,
        targetName: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where: { twoFactorEnabled: false } }),
  ]);

  // User growth (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const userGrowth = await prisma.user.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Top users by activity (7d)
  const topUsers = await prisma.auditLog.groupBy({
    by: ["userId", "userName"],
    where: { createdAt: { gte: sevenDaysAgo }, userId: { not: null } },
    _count: true,
    orderBy: { _count: { userId: "desc" } },
    take: 5,
  });

  return {
    totalUsers,
    activeUserCount: activeUsers.length,
    totalSpools,
    totalPrints,
    filamentUsedGrams: filamentUsed._sum.gramsUsed ?? 0,
    activeSessions,
    recentActivity,
    usersWithout2FA,
    userGrowth: userGrowth.map((u) => u.createdAt.toISOString().slice(0, 10)),
    topUsers: topUsers.map((u) => ({
      name: u.userName ?? "Unknown",
      count: u._count,
    })),
  };
}
