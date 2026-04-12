"use server";

import { prisma } from "./prisma";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";

interface AuditUser {
  id: string;
  email: string;
  name: string;
}

interface AuditEntry {
  user?: AuditUser;
  userId?: string;
  userEmail?: string;
  userName?: string;
  action: string;
  category: "auth" | "spool" | "print" | "box" | "admin" | "system" | "preset";
  severity?: "info" | "warning" | "error" | "critical";
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
}

export async function audit(entry: AuditEntry) {
  let ip: string | null = null;
  let ua: string | null = null;

  try {
    const hdrs = await headers();
    ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? null;
    ua = hdrs.get("user-agent") ?? null;
  } catch {
    // headers() not available outside request context
  }

  // Fire-and-forget — don't block the action
  prisma.auditLog
    .create({
      data: {
        userId: entry.user?.id ?? entry.userId ?? null,
        userEmail: entry.user?.email ?? entry.userEmail ?? null,
        userName: entry.user?.name ?? entry.userName ?? null,
        action: entry.action,
        category: entry.category,
        severity: entry.severity ?? "info",
        targetType: entry.targetType ?? null,
        targetId: entry.targetId ?? null,
        targetName: entry.targetName ?? null,
        metadata: (entry.metadata as Prisma.InputJsonValue) ?? undefined,
        ipAddress: ip,
        userAgent: ua,
      },
    })
    .catch(console.error);
}
