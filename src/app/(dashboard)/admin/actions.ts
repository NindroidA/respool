"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession(await headers());
  if (!session?.user) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") throw new Error("Forbidden");
  return session.user;
}

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

  revalidatePath("/admin");
}

export async function toggleUserBan(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) throw new Error("Cannot ban yourself");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { banned: true },
  });

  if (!user) throw new Error("User not found");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { banned: !user.banned },
    }),
    // Delete all sessions if banning
    ...(!user.banned
      ? [prisma.session.deleteMany({ where: { userId } })]
      : []),
  ]);

  revalidatePath("/admin");
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin();

  if (userId === admin.id) throw new Error("Cannot delete yourself");

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin");
}
