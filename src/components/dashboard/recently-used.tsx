import Link from "next/link";
import { ProgressBar } from "@/components/shared/progress-bar";
import { QuickLog } from "@/components/spools/quick-log";

interface RecentSpool {
  id: string;
  name: string;
  color: string;
  material: string;
  currentMass: number;
  startingMass: number;
}

interface RecentlyUsedProps {
  spools: RecentSpool[];
}

export function RecentlyUsed({ spools }: RecentlyUsedProps) {
  if (spools.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-(--text-faint)">
        Recently Used
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {spools.map((spool) => (
          <div
            key={spool.id}
            className="flex w-[180px] shrink-0 flex-col rounded-lg border border-border bg-card p-3"
          >
            <div className="flex items-center justify-between">
              <Link
                href={`/spools/${spool.id}`}
                className="flex items-center gap-2 min-w-0"
              >
                <div
                  className="h-4 w-4 shrink-0 rounded-full border border-(--border-subtle)"
                  style={{ backgroundColor: spool.color }}
                />
                <p className="truncate text-xs font-medium text-foreground">
                  {spool.name}
                </p>
              </Link>
              <QuickLog
                spoolId={spool.id}
                currentMass={spool.currentMass}
                spoolName={spool.name}
              />
            </div>
            <p className="mt-2 font-mono text-xs font-semibold text-neon">
              {spool.currentMass}g
            </p>
            <ProgressBar
              current={spool.currentMass}
              total={spool.startingMass}
              className="mt-1.5"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
