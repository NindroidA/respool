import Link from "next/link";
import { ProgressBar } from "@/components/shared/progress-bar";
import { AlertTriangle } from "lucide-react";

interface LowSpool {
  id: string;
  name: string;
  brand: string;
  color: string;
  material: string;
  currentMass: number;
  startingMass: number;
}

interface LowFilamentAlertsProps {
  spools: LowSpool[];
}

export function LowFilamentAlerts({ spools }: LowFilamentAlertsProps) {
  if (spools.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-(--color-warning)" />
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-(--text-faint)">
          Low Filament
        </p>
      </div>
      <div className="space-y-2">
        {spools.map((spool) => (
          <Link
            key={spool.id}
            href={`/spools/${spool.id}`}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-(--bg-card-hover) glow-amber"
          >
            <div
              className="h-4 w-4 shrink-0 rounded-full border border-(--border-subtle)"
              style={{ backgroundColor: spool.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {spool.name}
              </p>
              <ProgressBar
                current={spool.currentMass}
                total={spool.startingMass}
                className="mt-1.5"
              />
            </div>
            <span className="shrink-0 font-mono text-xs font-semibold text-(--color-warning)">
              {spool.currentMass}g
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
