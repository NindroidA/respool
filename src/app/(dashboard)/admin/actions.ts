"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { audit } from "@/lib/audit";

export async function getUsers() {
  await requireAdmin();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      banned: true,
      createdAt: true,
      lastAccessed: true,
      accounts: {
        select: { providerId: true },
      },
      _count: {
        select: { sessions: true },
      },
    },
  });

  return users.map((u) => ({
    ...u,
    providers: [...new Set(u.accounts.map((a) => a.providerId))],
    sessionCount: u._count.sessions,
  }));
}

export async function toggleUserRole(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) throw new Error("Cannot change your own role");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) throw new Error("User not found");

  const newRole = user.role === "admin" ? "user" : "admin";

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  audit({
    userId: admin.id,
    userEmail: admin.email,
    userName: admin.name,
    action: "admin.user_role_changed",
    category: "admin",
    severity: "warning",
    targetType: "User",
    targetId: userId,
    metadata: { from: user.role, to: newRole },
  });

  revalidatePath("/admin");
}

export async function toggleUserBan(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) throw new Error("Cannot ban yourself");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true, name: true },
  });

  if (!user) throw new Error("User not found");

  const nowBanned = !user.banned;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { banned: nowBanned },
    }),
    // Delete all sessions if banning
    ...(nowBanned ? [prisma.session.deleteMany({ where: { userId } })] : []),
  ]);

  audit({
    userId: admin.id,
    userEmail: admin.email,
    userName: admin.name,
    action: nowBanned ? "admin.user_banned" : "admin.user_unbanned",
    category: "admin",
    severity: nowBanned ? "critical" : "warning",
    targetType: "User",
    targetId: userId,
    targetName: user.name,
  });

  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) throw new Error("Cannot delete yourself");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  await prisma.user.delete({ where: { id: userId } });

  audit({
    userId: admin.id,
    userEmail: admin.email,
    userName: admin.name,
    action: "admin.user_deleted",
    category: "admin",
    severity: "critical",
    targetType: "User",
    targetId: userId,
    targetName: user?.name ?? undefined,
    metadata: { deletedEmail: user?.email },
  });

  revalidatePath("/admin");
}
