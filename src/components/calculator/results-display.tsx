"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SwapResult } from "@/lib/filament-utils";
import type { SlicerProfile } from "@/lib/slicer-profiles";
import type { InventorySpool, SelectedSpool } from "@/hooks/use-calculator";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Pause,
  ArrowRight,
  Zap,
  Info,
  Plus,
} from "lucide-react";

interface ResultsDisplayProps {
  results: SwapResult;
  sortedSpools: SelectedSpool[];
  slicerProfile: SlicerProfile | null;
  recommendations: {
    deficit: number;
    spools: InventorySpool[];
    canCover: boolean;
  } | null;
  onAddSpool: (inv: InventorySpool) => void;
}

export function ResultsDisplay({
  results,
  sortedSpools,
  slicerProfile,
  recommendations,
  onAddSpool,
}: ResultsDisplayProps) {
  const pauseInstr = slicerProfile?.pauseInstructions;

  return (
    <div className="space-y-6 border-t border-border pt-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <h2 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-lg font-bold text-transparent">
          Results
        </h2>
        <Badge
          variant="outline"
          className={
            results.mode === "gcode"
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-muted-foreground/30 bg-muted text-muted-foreground"
          }
        >
          {results.mode === "gcode" ? "G-CODE ACCURATE" : "LINEAR ESTIMATE"}
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {results.gramsPerLayer && (
          <StatBox value={`${results.gramsPerLayer}g`} label="avg per layer" />
        )}
        <StatBox value={`${results.totalAvailable}g`} label="available" accent="emerald" />
        <StatBox value={`${results.totalNeeded}g`} label="print needs" accent="teal" />
        {results.totalPurgeWaste > 0 && (
          <StatBox
            value={`+${results.totalPurgeWaste}g`}
            label={`purge waste (${results.numSwaps + 1} loads)`}
            accent="amber"
          />
        )}
        <StatBox
          value={results.enough ? "Enough" : "Short"}
          label={
            results.enough
              ? `${Math.round(results.totalAvailable - results.totalWithPurge)}g spare`
              : `need ${Math.round(results.totalWithPurge - results.totalAvailable)}g more`
          }
          icon={results.enough ? CheckCircle2 : XCircle}
          accent={results.enough ? "green" : "red"}
        />
      </div>

      {/* Not enough filament — recommendations */}
      {!results.enough && recommendations && (
        <div className="space-y-3 rounded-xl border border-red-500/20 bg-linear-to-r from-red-500/5 to-transparent p-4">
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
            <div>
              <p className="font-medium text-red-300">
                Not enough filament — you need{" "}
                <span className="font-mono">{recommendations.deficit}g</span> more.
              </p>
              {recommendations.spools.length > 0 ? (
                <p className="mt-1 text-muted-foreground">
                  {recommendations.canCover
                    ? `Adding ${recommendations.spools.length === 1 ? "this spool" : "these spools"} would cover the deficit:`
                    : "These spools would help, but you still won't have enough:"}
                </p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  You don&apos;t have any more spools in your inventory to add.
                </p>
              )}
            </div>
          </div>
          {recommendations.spools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recommendations.spools.map((spool) => (
                <Button
                  key={spool.id}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-red-500/30 hover:border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={() => onAddSpool(spool)}
                >
                  <Plus className="size-3 text-emerald-400" />
                  <span
                    className="inline-block size-2.5 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: spool.color }}
                  />
                  {spool.brand ? `${spool.brand} ` : ""}
                  {spool.name}
                  <span className="font-mono text-muted-foreground">{spool.currentMass}g</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Layers not fully covered */}
      {results.enough && results.layersCovered < results.totalLayers && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Only covers {results.layersCovered} of {results.totalLayers} layers.
          </span>
        </div>
      )}

      {/* Pause Schedule */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Swap Schedule
        </h3>
        <div className="space-y-2">
          {results.schedule.map((s, i) => {
            const spool = sortedSpools[i];
            return (
              <div
                key={i}
                className="group relative overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/20"
              >
                {spool && (
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: spool.color }}
                  />
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 pl-4">
                  <div className="min-w-32 flex-1">
                    <div className="flex items-center gap-2">
                      {spool && (
                        <span
                          className="inline-block size-3 rounded-full ring-1 ring-white/10"
                          style={{ backgroundColor: spool.color }}
                        />
                      )}
                      <span className="text-sm font-semibold text-primary">
                        Spool {s.spool}
                        {spool && (
                          <span className="ml-1 font-normal text-foreground">
                            — {spool.brand ? `${spool.brand} ` : ""}
                            {spool.name}
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{s.gramsAvailable}g</span> available
                      → <span className="font-mono">{s.gramsUsed}g</span> print
                      {s.purgeGrams > 0 && (
                        <> + <span className="font-mono">{s.purgeGrams}g</span> purge</>
                      )}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-medium text-secondary-foreground">
                    Layers {s.startLayer}–{s.endLayer}
                  </span>
                  <div className="ml-auto">
                    {s.pauseBeforeLayer ? (
                      <Badge className="gap-1.5 border-amber-500/30 bg-amber-500/15 text-amber-400">
                        <Pause className="size-3" />
                        Swap at layer {s.pauseBeforeLayer}
                      </Badge>
                    ) : (
                      <Badge className="gap-1.5 border-emerald-500/30 bg-emerald-500/15 text-emerald-400">
                        <CheckCircle2 className="size-3" />
                        Print complete
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slicer-Specific Pause Instructions */}
      {results.schedule.some((s) => s.pauseBeforeLayer) && pauseInstr && (
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 via-transparent to-teal-500/5">
          <div className="border-b border-primary/10 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <Zap className="size-4" />
              {pauseInstr.title}
            </h3>
          </div>
          <div className="space-y-3 p-4">
            {results.schedule
              .filter((s) => s.pauseBeforeLayer)
              .map((s, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-mono font-bold text-amber-400">
                    Layer {s.pauseBeforeLayer}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="text-foreground">
                    Swap from{" "}
                    <span className="font-semibold text-primary">Spool {s.spool}</span> to{" "}
                    <span className="font-semibold text-primary">Spool {s.spool + 1}</span>
                  </span>
                </div>
              ))}

            {/* Step-by-step instructions */}
            <div className="mt-3 space-y-1.5 rounded-lg bg-card/50 px-3 py-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                How to set up in {slicerProfile?.name}:
              </p>
              <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground">
                {pauseInstr.steps.map((step, i) => (
                  <li key={i}>
                    {step.replace(
                      "{layer}",
                      String(results.schedule.find((s) => s.pauseBeforeLayer)?.pauseBeforeLayer ?? "X"),
                    )}
                  </li>
                ))}
              </ol>
              {pauseInstr.note && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-primary/60">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  <span>{pauseInstr.note}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No swaps needed */}
      {results.enough && !results.schedule.some((s) => s.pauseBeforeLayer) && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          <span className="font-medium">
            No spool swaps needed — your spool covers the entire print!
          </span>
        </div>
      )}
    </div>
  );
}

function StatBox({
  value,
  label,
  accent,
  icon: Icon,
}: {
  value: string;
  label: string;
  accent?: "emerald" | "teal" | "amber" | "green" | "red";
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const colors = {
    emerald: "border-emerald-500/20 from-emerald-500/10 text-emerald-400",
    teal: "border-teal-500/20 from-teal-500/10 text-teal-400",
    amber: "border-amber-500/20 from-amber-500/10 text-amber-400",
    green: "border-emerald-500/30 from-emerald-500/10 text-emerald-400",
    red: "border-red-500/30 from-red-500/10 text-red-400",
  };

  const colorClass = accent ? colors[accent] : "border-border from-card text-foreground";

  return (
    <div className={`rounded-xl border bg-linear-to-b to-card p-3 text-center ${colorClass}`}>
      <div className="flex items-center justify-center gap-1 font-mono text-lg font-bold">
        {Icon && <Icon className="size-4" />}
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
