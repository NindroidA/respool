import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { ShieldAlert, Key, Monitor, AlertTriangle } from "lucide-react";

async function getSecurityData() {
  await requireAdmin();

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    authEvents,
    failedLogins,
    activeSessions,
    twoFactorStats,
    bannedUsers,
    criticalEvents,
  ] = await Promise.all([
    prisma.auditLog.findMany({
      where: { category: "auth", createdAt: { gte: sevenDaysAgo } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true, action: true, severity: true,
        userName: true, userEmail: true, ipAddress: true,
        createdAt: true, metadata: true,
      },
    }),
    prisma.auditLog.count({
      where: {
        action: "auth.login_failed",
        createdAt: { gte: sevenDaysAgo },
      },
    }),
    prisma.session.findMany({
      where: { expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        userId: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        expiresAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.user.groupBy({
      by: ["twoFactorEnabled"],
      _count: true,
    }),
    prisma.user.count({ where: { banned: true } }),
    prisma.auditLog.findMany({
      where: {
        severity: { in: ["error", "critical"] },
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const with2FA = twoFactorStats.find((s) => s.twoFactorEnabled)?._count ?? 0;
  const without2FA = twoFactorStats.find((s) => !s.twoFactorEnabled)?._count ?? 0;

  return {
    authEvents,
    failedLogins,
    activeSessions,
    with2FA,
    without2FA,
    bannedUsers,
    criticalEvents,
  };
}

export default async function SecurityPage() {
  const data = await getSecurityData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground">
          Auth events, sessions, and threat indicators.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <ShieldAlert className="mx-auto mb-1 h-4 w-4 text-(--color-warning)" />
          <p className="font-mono text-xl font-bold text-(--color-warning)">{data.failedLogins}</p>
          <p className="text-2xs text-(--text-faint)">Failed Logins (7d)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Monitor className="mx-auto mb-1 h-4 w-4 text-jade" />
          <p className="font-mono text-xl font-bold text-jade">{data.activeSessions.length}</p>
          <p className="text-2xs text-(--text-faint)">Active Sessions</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Key className="mx-auto mb-1 h-4 w-4 text-teal-400" />
          <p className="font-mono text-xl font-bold text-teal-400">{data.with2FA}</p>
          <p className="text-2xs text-(--text-faint)">2FA Enabled</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-(--color-error)" />
          <p className="font-mono text-xl font-bold text-(--color-error)">{data.bannedUsers}</p>
          <p className="text-2xs text-(--text-faint)">Banned Users</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Auth Events Timeline */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Auth Events (7d)
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {data.authEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-2 text-sm">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                  event.severity === "warning" ? "bg-(--color-warning)" : "bg-(--text-faint)"
                }`} />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-foreground">{event.userName ?? event.userEmail ?? "Unknown"}</span>
                  {" "}
                  <span className="text-(--text-muted)">{event.action}</span>
                  {event.ipAddress && (
                    <span className="ml-1 text-xs text-(--text-faint)">from {event.ipAddress}</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-(--text-faint)">
                  {new Date(event.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
            {data.authEvents.length === 0 && (
              <p className="text-sm text-(--text-muted)">No auth events</p>
            )}
          </div>
        </div>

        {/* Active Sessions */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Active Sessions
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {data.activeSessions.map((session) => (
              <div key={session.id} className="flex items-center gap-3 rounded-lg border border-border p-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{session.user.name}</p>
                  <p className="truncate text-xs text-(--text-faint)">
                    {session.ipAddress ?? "Unknown IP"} &middot; {session.userAgent?.slice(0, 40) ?? ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-(--text-faint)">
                  {new Date(session.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Events */}
      {data.criticalEvents.length > 0 && (
        <div className="rounded-xl border border-(--color-error)/30 bg-(--color-error-muted) p-5">
          <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--color-error)">
            Critical/Error Events (7d)
          </p>
          <div className="space-y-2">
            {data.criticalEvents.map((event) => (
              <div key={event.id} className="text-sm">
                <span className="font-medium text-(--color-error)">{event.action}</span>
                {" "}
                <span className="text-foreground">{event.userName ?? "System"}</span>
                {event.targetName && <span className="text-(--text-muted)"> — {event.targetName}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2FA Compliance */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
          2FA Compliance
        </p>
        <div className="flex items-center gap-4">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--bg-surface)">
            <div
              className="h-full rounded-full bg-jade"
              style={{ width: `${data.with2FA + data.without2FA > 0 ? (data.with2FA / (data.with2FA + data.without2FA)) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-mono text-(--text-muted)">
            {data.with2FA}/{data.with2FA + data.without2FA}
          </span>
        </div>
      </div>
    </div>
  );
}
