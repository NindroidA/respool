import { Suspense } from "react";
import { getSpools, getBoxesForSelect, getFilamentColors } from "./actions";
import { SpoolCard } from "@/components/spools/spool-card";
import { SpoolForm } from "@/components/spools/spool-form";
import { SpoolFilters } from "@/components/spools/spool-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Disc } from "lucide-react";

interface Props {
  searchParams: Promise<{
    search?: string;
    material?: string;
    sort?: string;
    archived?: string;
  }>;
}

export default async function SpoolsPage({ searchParams }: Props) {
  const params = await searchParams;

  const [spools, boxes, colors] = await Promise.all([
    getSpools({
      search: params.search,
      material: params.material !== "all" ? params.material : undefined,
      sort: params.sort,
      archived: params.archived === "true",
    }),
    getBoxesForSelect(),
    getFilamentColors(),
  ]);

  // Recently used (top 4, only on non-filtered view)
  const recentlyUsed =
    !params.search && !params.material && params.archived !== "true"
      ? spools.slice(0, 4)
      : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Spools
          </h1>
          <p className="text-sm text-muted-foreground">
            {spools.length} spool{spools.length !== 1 ? "s" : ""}
          </p>
        </div>
        <SpoolForm boxes={boxes} colors={colors} />
      </div>

      {/* Filters */}
      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <SpoolFilters />
      </Suspense>

      {/* Recently Used */}
      {recentlyUsed.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Recently Used
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyUsed.map((spool, i) => (
              <SpoolCard key={spool.id} spool={spool} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* All Spools */}
      <div>
        {recentlyUsed.length > 0 && (
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            All Spools
          </p>
        )}
        {spools.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {spools.map((spool, i) => (
              <SpoolCard key={spool.id} spool={spool} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <Disc className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              No spools yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your first filament spool to get started
            </p>
            <div className="mt-4">
              <SpoolForm boxes={boxes} colors={colors} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
