import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/dashboard/stat-card";
import { MaterialChart } from "@/components/dashboard/material-chart";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { LowFilamentAlerts } from "@/components/dashboard/low-filament-alerts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RecentlyUsed } from "@/components/dashboard/recently-used";
import { MATERIAL_COLORS } from "@/lib/constants";

async function getDashboardData(userId: string) {
  const [spools, logs, prints, settings] = await Promise.all([
    prisma.spool.findMany({
      where: { userId, archived: false },
      orderBy: { lastUsed: "desc" },
    }),
    prisma.spoolLog.findMany({
      where: { spool: { userId } },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { spool: { select: { name: true } } },
    }),
    prisma.print.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const threshold = settings?.lowFilamentThreshold ?? 100;

  // Stats
  const totalSpools = spools.length;
  const totalAvailable = spools.reduce((sum, s) => sum + s.currentMass, 0);
  const totalUsed = logs.reduce((sum, l) => sum + l.gramsUsed, 0);
  const totalStarting = spools.reduce((sum, s) => sum + s.startingMass, 0);
  const avgUtilization =
    totalStarting > 0
      ? Math.round(((totalStarting - totalAvailable) / totalStarting) * 100)
      : 0;

  // Material breakdown
  const materialMap = new Map<string, number>();
  for (const spool of spools) {
    materialMap.set(
      spool.material,
      (materialMap.get(spool.material) ?? 0) + spool.currentMass,
    );
  }
  const materialData = Array.from(materialMap.entries())
    .map(([material, grams]) => ({ material, grams }))
    .sort((a, b) => b.grams - a.grams);

  // Weekly usage (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const recentLogs = logs.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo);

  const weekMap = new Map<string, number>();
  for (const log of recentLogs) {
    const d = new Date(log.createdAt);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
    weekMap.set(key, (weekMap.get(key) ?? 0) + log.gramsUsed);
  }
  const usageData = Array.from(weekMap.entries())
    .map(([week, grams]) => ({ week, grams }))
    .reverse();

  // Low filament
  const lowSpools = spools
    .filter((s) => s.currentMass <= threshold && s.currentMass > 0)
    .sort((a, b) => a.currentMass - b.currentMass);

  // Recently used (top 4, only spools that have actually been used)
  const recentlyUsed = spools
    .filter((s) => s.lastUsed !== null)
    .sort(
      (a, b) =>
        new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime(),
    )
    .slice(0, 4);

  // Activity feed
  const activities = [
    ...logs.slice(0, 10).map((l) => ({
      id: l.id,
      type: "log" as const,
      description: `Used ${l.gramsUsed}g from ${l.spool.name}`,
      timestamp: l.createdAt,
    })),
    ...prints.slice(0, 5).map((p) => ({
      id: p.id,
      type: "print" as const,
      description: `Print: ${p.name} (${p.totalGramsUsed}g)`,
      timestamp: p.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 10);

  return {
    totalSpools,
    totalAvailable,
    totalUsed,
    avgUtilization,
    materialData,
    usageData,
    lowSpools,
    recentlyUsed,
    activities,
  };
}

export default async function DashboardPage() {
  const session = await getSession(await headers());
  if (!session?.user) redirect("/login");

  const data = await getDashboardData(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Your filament overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="active spools"
          value={data.totalSpools}
          iconName="disc"
        />
        <StatCard
          label="available"
          value={data.totalAvailable}
          suffix="g"
          iconName="weight"
          color="var(--accent-neon)"
        />
        <StatCard
          label="total used"
          value={data.totalUsed}
          suffix="g"
          iconName="trending-down"
        />
        <StatCard
          label="avg utilization"
          value={data.avgUtilization}
          suffix="%"
          iconName="percent"
        />
      </div>

      {/* Recently Used */}
      <RecentlyUsed spools={data.recentlyUsed} />

      {/* Charts */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-xl border border-primary/15 bg-linear-to-br from-primary/5 to-transparent p-4 ring-1 ring-primary/5">
          <p className="mb-2 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Filament by Material
          </p>
          <div className="h-50">
            <MaterialChart data={data.materialData} />
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3">
            {data.materialData.map((d) => (
              <div key={d.material} className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      MATERIAL_COLORS[d.material]?.primary ?? "#71717a",
                  }}
                />
                <span className="text-2xs text-muted-foreground">
                  {d.material} ({d.grams}g)
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-teal-500/15 bg-linear-to-br from-teal-500/5 to-transparent p-4 ring-1 ring-teal-500/5">
          <p className="mb-2 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Usage (Last 30 Days)
          </p>
          <div className="h-50">
            <UsageChart data={data.usageData} />
          </div>
        </div>
      </div>

      {/* Low Filament Alerts */}
      <LowFilamentAlerts spools={data.lowSpools} />

      {/* Activity Feed */}
      <div className="rounded-xl border border-border bg-card p-4 ring-1 ring-primary/5">
        <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
          Recent Activity
        </p>
        <ActivityFeed items={data.activities} />
      </div>
    </div>
  );
}
