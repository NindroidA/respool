import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSpool,
  getSpools,
  getBoxesForSelect,
  getFilamentColors,
} from "../actions";
import { ProgressBar } from "@/components/shared/progress-bar";
import { UsageTimeline } from "@/components/spools/usage-timeline";
import { SimilarColors } from "@/components/spools/similar-colors";
import { QuickLog } from "@/components/spools/quick-log";
import { SpoolForm } from "@/components/spools/spool-form";
import { SpoolDetailActions } from "@/components/spools/spool-detail-actions";
import { Badge } from "@/components/ui/badge";
import { MATERIAL_COLORS } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SpoolDetailPage({ params }: Props) {
  const { id } = await params;

  let spool;
  try {
    spool = await getSpool(id);
  } catch {
    notFound();
  }

  const [allSpools, boxes, colors] = await Promise.all([
    getSpools({ archived: false }),
    getBoxesForSelect(),
    getFilamentColors(),
  ]);

  const materialColor = MATERIAL_COLORS[spool.material] ?? {
    primary: "var(--text-muted)",
    light: "var(--text-secondary)",
  };

  const percentage =
    spool.startingMass > 0
      ? Math.round((spool.currentMass / spool.startingMass) * 100)
      : 0;

  const totalUsed = spool.startingMass - spool.currentMass;
  const timesUsed = spool.logs.length;
  const costPerGram =
    spool.cost && spool.startingMass > 0
      ? (spool.cost / spool.startingMass / 100).toFixed(3)
      : null;

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/spools"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-(--bg-card-hover) hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to spools
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Large color swatch */}
          <div
            className="h-14 w-14 shrink-0 rounded-xl border border-white/10 shadow-lg ring-2 ring-white/5"
            style={{ backgroundColor: spool.color }}
          />
          <div>
            <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
              {spool.name}
            </h1>
            <p className="text-sm text-muted-foreground">{spool.brand}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-transparent text-xs font-semibold"
                style={{
                  backgroundColor: `${materialColor.primary}18`,
                  color: materialColor.light,
                }}
              >
                {spool.material}
              </Badge>
              {spool.box && (
                <Badge variant="outline" className="text-xs">
                  {spool.box.name}
                </Badge>
              )}
              {spool.archived && (
                <Badge
                  variant="outline"
                  className="border-(--color-warning) text-xs text-(--color-warning)"
                >
                  Archived
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <QuickLog
            spoolId={spool.id}
            currentMass={spool.currentMass}
            spoolName={spool.name}
          />
          <SpoolForm
            spool={spool}
            boxes={boxes}
            colors={colors}
            trigger={<span className="text-sm">Edit</span>}
          />
          <SpoolDetailActions spoolId={spool.id} archived={spool.archived} />
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent p-5 ring-1 ring-primary/5">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-mono text-2xl font-bold text-neon">
            {spool.currentMass}g
          </span>
          <span className="font-mono text-sm text-muted-foreground">
            / {spool.startingMass}g ({percentage}%)
          </span>
        </div>
        <ProgressBar
          current={spool.currentMass}
          total={spool.startingMass}
          className="h-2.5"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-teal-500/20 bg-linear-to-br from-teal-500/10 to-transparent p-4 text-center ring-1 ring-teal-500/5">
          <p className="font-mono text-lg font-bold text-teal-400">
            {totalUsed}g
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-(--text-faint)">
            total used
          </p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/10 to-transparent p-4 text-center ring-1 ring-primary/5">
          <p className="font-mono text-lg font-bold text-primary">
            {timesUsed}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-(--text-faint)">
            times used
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 to-transparent p-4 text-center ring-1 ring-amber-500/5">
          <p className="font-mono text-lg font-bold text-amber-400">
            {spool.cost ? `$${(spool.cost / 100).toFixed(2)}` : "—"}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-(--text-faint)">
            cost
          </p>
        </div>
        <div className="rounded-xl border border-violet-500/20 bg-linear-to-br from-violet-500/10 to-transparent p-4 text-center ring-1 ring-violet-500/5">
          <p className="font-mono text-lg font-bold text-violet-400">
            {costPerGram ? `$${costPerGram}` : "—"}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-(--text-faint)">
            per gram
          </p>
        </div>
      </div>

      {/* Details */}
      {(spool.diameter || spool.printingTemperature || spool.note) && (
        <div className="rounded-xl border border-border bg-card p-5 ring-1 ring-primary/5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-(--text-faint)">
            Details
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            {spool.diameter && (
              <div>
                <p className="text-xs text-muted-foreground">Diameter</p>
                <p className="font-mono font-medium text-foreground">
                  {spool.diameter}mm
                </p>
              </div>
            )}
            {spool.printingTemperature && (
              <div>
                <p className="text-xs text-muted-foreground">Print Temp</p>
                <p className="font-mono font-medium text-foreground">
                  {spool.printingTemperature}°C
                </p>
              </div>
            )}
            {spool.filamentColor && (
              <div>
                <p className="text-xs text-muted-foreground">Color Name</p>
                <p className="font-medium text-foreground">
                  {spool.filamentColor.name}
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({spool.filamentColor.category})
                  </span>
                </p>
              </div>
            )}
          </div>
          {spool.note && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Note</p>
              <p className="mt-1 text-sm text-foreground">{spool.note}</p>
            </div>
          )}
        </div>
      )}

      {/* Usage Timeline */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-(--text-faint)">
          Usage History
        </p>
        <UsageTimeline logs={spool.logs} />
      </div>

      {/* Similar Colors */}
      <SimilarColors
        currentSpoolId={spool.id}
        currentColor={spool.color}
        allSpools={allSpools}
      />
    </div>
  );
}
