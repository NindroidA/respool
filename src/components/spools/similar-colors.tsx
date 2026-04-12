import Link from "next/link";
import { colorDistance } from "@/lib/filament-utils";
import { ProgressBar } from "@/components/shared/progress-bar";

interface SpoolSummary {
  id: string;
  name: string;
  color: string;
  currentMass: number;
  startingMass: number;
  material: string;
}

interface SimilarColorsProps {
  currentSpoolId: string;
  currentColor: string;
  allSpools: SpoolSummary[];
}

export function SimilarColors({
  currentSpoolId,
  currentColor,
  allSpools,
}: SimilarColorsProps) {
  const similar = allSpools
    .filter((s) => s.id !== currentSpoolId)
    .map((s) => ({ ...s, distance: colorDistance(currentColor, s.color) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  if (similar.length === 0) return null;

  return (
    <div>
      <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
        Similar Colors
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {similar.map((spool) => (
          <Link
            key={spool.id}
            href={`/spools/${spool.id}`}
            className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-(--bg-card-hover)"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 shrink-0 rounded-full border border-(--border-subtle)"
                style={{ backgroundColor: spool.color }}
              />
              <p className="truncate text-xs font-medium text-foreground">
                {spool.name}
              </p>
            </div>
            <p className="mt-1.5 font-mono text-2xs text-muted-foreground">
              {spool.currentMass}g remaining
            </p>
            <ProgressBar
              current={spool.currentMass}
              total={spool.startingMass}
              className="mt-1.5"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
