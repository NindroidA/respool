"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import { audit } from "@/lib/audit";
import { z } from "zod/v4";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export async function getProfileData() {
  const user = await requireUser();

  const [dbUser, spoolCount, printCount, totalUsed, accountInfo] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
          twoFactorEnabled: true,
        },
      }),
      prisma.spool.count({ where: { userId: user.id } }),
      prisma.print.count({ where: { userId: user.id } }),
      prisma.spoolLog.aggregate({
        where: { spool: { userId: user.id } },
        _sum: { gramsUsed: true },
      }),
      prisma.account.findMany({
        where: { userId: user.id },
        select: { providerId: true, createdAt: true },
      }),
    ]);

  return {
    user: dbUser,
    stats: {
      totalSpools: spoolCount,
      totalPrints: printCount,
      totalFilamentUsed: totalUsed._sum.gramsUsed ?? 0,
    },
    providers: accountInfo.map((a) => a.providerId),
  };
}

export async function updateProfile(data: { name: string }) {
  const user = await requireUser();
  const validated = updateProfileSchema.parse(data);

  await prisma.user.update({
    where: { id: user.id },
    data: { name: validated.name },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function deleteAccount() {
  const user = await requireUser();

  // Prevent admin from deleting themselves if they're the last admin
  const adminCount = await prisma.user.count({ where: { role: "admin" } });
  const isAdmin = (user as { role?: string }).role === "admin";
  if (isAdmin && adminCount <= 1) {
    throw new Error(
      "Cannot delete the last admin account. Promote another user first.",
    );
  }

  await audit({
    user: { id: user.id, email: user.email, name: user.name },
    action: "auth.account_deleted",
    category: "auth",
    severity: "critical",
    targetType: "User",
    targetId: user.id,
    targetName: user.name,
  });

  // Cascade delete: sessions, accounts, spools (→ logs), boxes, prints, settings, presets
  await prisma.user.delete({ where: { id: user.id } });
}
