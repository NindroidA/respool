import { getDashboardData } from "./actions";
import { StatCard } from "@/components/dashboard/stat-card";
import { MaterialChart } from "@/components/dashboard/material-chart";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { LowFilamentAlerts } from "@/components/dashboard/low-filament-alerts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RecentlyUsed } from "@/components/dashboard/recently-used";
import { MATERIAL_COLORS } from "@/lib/constants";

export default async function DashboardPage() {
  const data = await getDashboardData();

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
