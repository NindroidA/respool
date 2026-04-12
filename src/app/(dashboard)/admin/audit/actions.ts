"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import type { Prisma } from "@prisma/client";

export async function getAuditLogs(filters?: {
  search?: string;
  category?: string;
  severity?: string;
  page?: number;
  perPage?: number;
}) {
  await requireAdmin();

  const page = filters?.page ?? 1;
  const perPage = filters?.perPage ?? 50;
  const skip = (page - 1) * perPage;

  const where: Prisma.AuditLogWhereInput = {};

  if (filters?.category && filters.category !== "all")
    where.category = filters.category;
  if (filters?.severity && filters.severity !== "all")
    where.severity = filters.severity;
  if (filters?.search) {
    where.OR = [
      { action: { contains: filters.search, mode: "insensitive" } },
      { userName: { contains: filters.search, mode: "insensitive" } },
      { userEmail: { contains: filters.search, mode: "insensitive" } },
      { targetName: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}
