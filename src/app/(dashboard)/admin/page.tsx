import { getAdminStats } from "./overview-actions";
import {
  Shield,
  Users,
  Disc,
  Layers3,
  Scale,
  Wifi,
  AlertTriangle,
} from "lucide-react";

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  const severityColor: Record<string, string> = {
    info: "text-(--text-faint)",
    warning: "text-(--color-warning)",
    error: "text-(--color-error)",
    critical: "text-(--color-error) font-bold",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System overview at a glance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Total Users"
          value={stats.totalUsers}
          color="primary"
        />
        <StatCard
          icon={<Wifi className="h-4 w-4" />}
          label="Active (7d)"
          value={stats.activeUserCount}
          color="teal"
        />
        <StatCard
          icon={<Disc className="h-4 w-4" />}
          label="Spools"
          value={stats.totalSpools}
          color="emerald"
        />
        <StatCard
          icon={<Layers3 className="h-4 w-4" />}
          label="Prints"
          value={stats.totalPrints}
          color="amber"
        />
        <StatCard
          icon={<Scale className="h-4 w-4" />}
          label="Filament Used"
          value={`${(stats.filamentUsedGrams / 1000).toFixed(1)}kg`}
          color="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Recent Activity
          </p>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-(--text-muted)">No activity yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentActivity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <span
                    className={`mt-0.5 text-xs ${severityColor[event.severity] ?? ""}`}
                  >
                    {event.severity === "critical" || event.severity === "error"
                      ? "●"
                      : event.severity === "warning"
                        ? "●"
                        : "○"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="text-foreground">
                      {event.userName ?? "System"}
                    </span>{" "}
                    <span className="text-(--text-muted)">{event.action}</span>
                    {event.targetName && (
                      <span className="text-(--text-muted)">
                        {" "}
                        &ldquo;{event.targetName}&rdquo;
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-(--text-faint)">
                    {formatTimeAgo(new Date(event.createdAt))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts + Sessions */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
              Active Sessions
            </p>
            <p className="font-mono text-3xl font-bold text-jade">
              {stats.activeSessions}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
              Alerts
            </p>
            <div className="space-y-2">
              {stats.usersWithout2FA > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-(--color-warning)" />
                  <span className="text-foreground">
                    {stats.usersWithout2FA} user
                    {stats.usersWithout2FA !== 1 ? "s" : ""} without 2FA
                  </span>
                </div>
              )}
              {stats.usersWithout2FA === 0 && (
                <p className="flex items-center gap-2 text-sm text-jade">
                  <Shield className="h-4 w-4" />
                  All clear — no alerts
                </p>
              )}
            </div>
          </div>

          {/* Top Users */}
          {stats.topUsers.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
                Top Users (7d)
              </p>
              <div className="space-y-2">
                {stats.topUsers.map((u, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">
                      {i + 1}. {u.name}
                    </span>
                    <span className="font-mono text-(--text-muted)">
                      {u.count} actions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorMap: Record<string, { border: string; bg: string; text: string }> =
    {
      primary: {
        border: "border-primary/20",
        bg: "from-primary/10",
        text: "text-primary",
      },
      teal: {
        border: "border-teal-500/20",
        bg: "from-teal-500/10",
        text: "text-teal-400",
      },
      emerald: {
        border: "border-emerald-500/20",
        bg: "from-emerald-500/10",
        text: "text-emerald-400",
      },
      amber: {
        border: "border-amber-500/20",
        bg: "from-amber-500/10",
        text: "text-amber-400",
      },
      violet: {
        border: "border-violet-500/20",
        bg: "from-violet-500/10",
        text: "text-violet-400",
      },
    };

  const c = colorMap[color] ?? colorMap.primary;

  return (
    <div
      className={`rounded-xl border ${c.border} bg-linear-to-br ${c.bg} to-transparent p-4 text-center ring-1 ring-white/5`}
    >
      <div className={`mb-1 flex items-center justify-center ${c.text}`}>
        {icon}
      </div>
      <p className={`font-mono text-xl font-bold ${c.text}`}>{value}</p>
      <p className="text-2xs font-medium uppercase tracking-wider text-(--text-faint)">
        {label}
      </p>
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
