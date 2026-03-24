import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUsers } from "./actions";
import { UserTable } from "@/components/admin/user-table";
import { Shield, Users } from "lucide-react";

export default async function AdminPage() {
  const session = await getSession(await headers());
  if (!session?.user) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== "admin") redirect("/dashboard");

  const users = await getUsers();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--accent-jade-muted)">
          <Shield className="h-5 w-5 text-jade" />
        </div>
        <div>
          <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">User management</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm font-medium text-foreground">
            {users.length}
          </span>
          <span className="text-sm text-muted-foreground">
            user{users.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-jade" />
          <span className="font-mono text-sm font-medium text-foreground">
            {users.filter((u) => u.role === "admin").length}
          </span>
          <span className="text-sm text-muted-foreground">admin(s)</span>
        </div>
      </div>

      {/* User table */}
      <div className="rounded-xl border border-border bg-card">
        <UserTable users={users} currentUserId={session.user.id} />
      </div>
    </div>
  );
}
