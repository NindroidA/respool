import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { Server, Database, HardDrive, Clock, CheckCircle2, AlertCircle } from "lucide-react";

async function getSystemHealth() {
  await requireAdmin();

  // DB connection check
  let dbConnected = false;
  let dbLatencyMs = 0;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbConnected = true;
  } catch {
    dbConnected = false;
  }

  // Table sizes
  const tableSizes = await prisma.$queryRaw<
    { table_name: string; row_count: bigint }[]
  >`
    SELECT relname AS table_name, n_live_tup AS row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
    LIMIT 15
  `;

  // App info
  const appVersion = process.env.APP_VERSION ?? "unknown";
  const nodeVersion = process.version;
  const env = process.env.NODE_ENV ?? "development";

  // Counts
  const [userCount, spoolCount, printCount, auditCount, sessionCount] =
    await Promise.all([
      prisma.user.count(),
      prisma.spool.count(),
      prisma.print.count(),
      prisma.auditLog.count(),
      prisma.session.count(),
    ]);

  return {
    dbConnected,
    dbLatencyMs,
    tableSizes: tableSizes.map((t) => ({
      name: t.table_name,
      rows: Number(t.row_count),
    })),
    appVersion,
    nodeVersion,
    env,
    counts: { userCount, spoolCount, printCount, auditCount, sessionCount },
    uptime: process.uptime(),
  };
}

export default async function SystemHealthPage() {
  const data = await getSystemHealth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">System Health</h2>
        <p className="text-sm text-muted-foreground">
          Database, application, and environment status.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Database className="mx-auto mb-1 h-4 w-4 text-jade" />
          <div className="flex items-center justify-center gap-1">
            {data.dbConnected ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-jade" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-(--color-error)" />
            )}
            <span className={`text-sm font-medium ${data.dbConnected ? "text-jade" : "text-(--color-error)"}`}>
              {data.dbConnected ? "Connected" : "Down"}
            </span>
          </div>
          <p className="text-2xs text-(--text-faint)">DB Status ({data.dbLatencyMs}ms)</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Server className="mx-auto mb-1 h-4 w-4 text-teal-400" />
          <p className="font-mono text-sm font-bold text-teal-400">v{data.appVersion}</p>
          <p className="text-2xs text-(--text-faint)">App Version</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <HardDrive className="mx-auto mb-1 h-4 w-4 text-amber-400" />
          <p className="font-mono text-sm font-bold text-amber-400">{data.nodeVersion}</p>
          <p className="text-2xs text-(--text-faint)">Node.js</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Clock className="mx-auto mb-1 h-4 w-4 text-violet-400" />
          <p className="font-mono text-sm font-bold text-violet-400">
            {formatUptime(data.uptime)}
          </p>
          <p className="text-2xs text-(--text-faint)">Uptime</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Table Sizes */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Database Tables
          </p>
          <div className="space-y-1.5">
            {data.tableSizes.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-sm">
                <span className="font-mono text-foreground">{t.name}</span>
                <span className="font-mono text-(--text-muted)">
                  {t.rows.toLocaleString()} rows
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Record Counts */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Record Counts
          </p>
          <div className="space-y-3">
            <CountRow label="Users" count={data.counts.userCount} />
            <CountRow label="Spools" count={data.counts.spoolCount} />
            <CountRow label="Prints" count={data.counts.printCount} />
            <CountRow label="Audit Logs" count={data.counts.auditCount} />
            <CountRow label="Sessions" count={data.counts.sessionCount} />
          </div>
        </div>
      </div>

      {/* Environment */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
          Environment
        </p>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <span className="text-(--text-faint)">NODE_ENV: </span>
            <span className="font-mono font-medium text-foreground">{data.env}</span>
          </div>
          <div>
            <span className="text-(--text-faint)">Node: </span>
            <span className="font-mono font-medium text-foreground">{data.nodeVersion}</span>
          </div>
          <div>
            <span className="text-(--text-faint)">Platform: </span>
            <span className="font-mono font-medium text-foreground">{process.platform}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CountRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <span className="font-mono text-sm font-medium text-jade">{count.toLocaleString()}</span>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m}m`;
}
