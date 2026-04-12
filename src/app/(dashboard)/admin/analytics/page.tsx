import { getAnalytics } from "./actions";

export default async function AnalyticsPage() {
  const data = await getAnalytics();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Usage patterns and engagement metrics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* DAU Chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Daily Active Users (7d)
          </p>
          <div className="flex items-end gap-2">
            {data.dauByDay.map((d) => {
              const max = Math.max(...data.dauByDay.map((x) => x.count), 1);
              const heightPct = (d.count / max) * 100;
              return (
                <div
                  key={d.day}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <span className="font-mono text-2xs text-(--text-muted)">
                    {d.count}
                  </span>
                  <div
                    className="w-full rounded-t bg-jade"
                    style={{
                      height: `${Math.max(heightPct * 0.8, 4)}px`,
                      maxHeight: "80px",
                    }}
                  />
                  <span className="text-2xs text-(--text-faint)">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Engagement by Category */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Activity by Category (30d)
          </p>
          <div className="space-y-2">
            {data.userEngagement.map((e) => {
              const max = Math.max(
                ...data.userEngagement.map((x) => x.count),
                1,
              );
              return (
                <div key={e.category}>
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-foreground">
                      {e.category}
                    </span>
                    <span className="font-mono text-(--text-muted)">
                      {e.count}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-(--bg-surface)">
                    <div
                      className="h-full rounded-full bg-jade"
                      style={{ width: `${(e.count / max) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spools by Material */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Active Spools by Material
          </p>
          <div className="space-y-2">
            {data.spoolsByMaterial.map((s) => (
              <div
                key={s.material}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-foreground">{s.material}</span>
                <span className="font-mono text-(--text-muted)">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Users */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Top Users by Activity (7d)
          </p>
          <div className="space-y-2">
            {data.topUsers.map((u, i) => (
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
            {data.topUsers.length === 0 && (
              <p className="text-sm text-(--text-muted)">
                No activity data yet
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filament Summary */}
      <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent p-5 ring-1 ring-primary/5">
        <p className="text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
          Filament Consumed (30d)
        </p>
        <p className="mt-2 font-mono text-3xl font-bold text-jade">
          {(data.filamentUsed30d / 1000).toFixed(2)}kg
        </p>
      </div>
    </div>
  );
}
