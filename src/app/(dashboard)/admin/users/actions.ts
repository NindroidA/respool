"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";

export async function getEnhancedUsers(filters?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  perPage?: number;
}) {
  await requireAdmin();

  const page = filters?.page ?? 1;
  const perPage = filters?.perPage ?? 20;
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {};

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.role && filters.role !== "all") where.role = filters.role;
  if (filters?.status === "banned") where.banned = true;
  if (filters?.status === "active") where.banned = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastAccessed: true,
        _count: {
          select: { spools: true, prints: true, sessions: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      ...u,
      spoolCount: u._count.spools,
      printCount: u._count.prints,
      sessionCount: u._count.sessions,
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function getUserDetail(userId: string) {
  await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: { select: { providerId: true } },
      sessions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true,
        },
      },
      _count: {
        select: { spools: true, prints: true, sessions: true },
      },
    },
  });

  if (!user) throw new Error("User not found");

  const recentActivity = await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      action: true,
      category: true,
      severity: true,
      targetName: true,
      createdAt: true,
    },
  });

  return {
    ...user,
    providers: [...new Set(user.accounts.map((a) => a.providerId))],
    spoolCount: user._count.spools,
    printCount: user._count.prints,
    sessionCount: user._count.sessions,
    recentActivity,
  };
}
