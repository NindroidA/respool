"use client";

import { useCalculator, type InventorySpool } from "@/hooks/use-calculator";
import { GcodeUpload } from "@/components/calculator/gcode-upload";
import { ResultsDisplay } from "@/components/calculator/results-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StyledSelect } from "@/components/ui/styled-select";
import {
  FileCode2,
  Layers,
  Calculator,
  RotateCcw,
  AlertTriangle,
  Trash2,
  Disc,
  Plus,
} from "lucide-react";
import type { SortOption } from "@/hooks/use-calculator";

interface Props {
  inventorySpools: InventorySpool[];
}

export function CalculatorClient({ inventorySpools }: Props) {
  const { state, actions, derived } = useCalculator(inventorySpools);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Spool Swap Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Figure out exactly where to pause &amp; swap partial spools
        </p>
      </div>

      {/* Mode Toggle */}
      <Tabs
        value={state.mode}
        onValueChange={(v) => actions.setMode(v as "gcode" | "manual")}
      >
        <TabsList>
          <TabsTrigger value="gcode">
            <FileCode2 className="mr-1.5 size-3.5" />
            G-code (accurate)
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Layers className="mr-1.5 size-3.5" />
            Manual (estimate)
          </TabsTrigger>
        </TabsList>

        {/* G-code Upload Tab */}
        <TabsContent value="gcode" className="mt-4">
          <GcodeUpload
            gcodeData={state.gcodeData}
            gcodeError={state.gcodeError}
            gcodeMetadata={state.gcodeMetadata}
            gcodeWarnings={state.gcodeWarnings}
            gcodeName={state.gcodeName}
            gcodeLoading={state.gcodeLoading}
            density={state.density}
            selectedMaterial={state.selectedMaterial}
            slicerOverride={state.slicerOverride}
            fileRef={actions.fileRef}
            onFileChange={actions.handleFile}
            onClear={actions.clearGcode}
            onChangeMaterial={actions.changeMaterial}
            onSlicerOverride={actions.setSlicerOverride}
          />
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="manual-grams">Total filament (g)</Label>
              <Input
                id="manual-grams"
                type="number"
                placeholder="e.g. 245"
                value={state.totalGrams}
                onChange={(e) => actions.setTotalGrams(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                From your slicer estimate
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manual-layers">Total layers</Label>
              <Input
                id="manual-layers"
                type="number"
                placeholder="e.g. 380"
                value={state.totalLayers}
                onChange={(e) => actions.setTotalLayers(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                From your slicer preview
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Spool Selection ───────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Selected Spools
            </h2>
            <p className="text-xs text-muted-foreground">
              First spool loads first — reorder by changing sort
            </p>
          </div>
          {state.selectedSpools.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Sort:</Label>
              <StyledSelect
                value={state.sortOption}
                onChange={(v) => actions.setSortOption(v as SortOption)}
                size="sm"
                className="w-44"
                options={[
                  { value: "custom", label: "Custom Order" },
                  { value: "least-first", label: "Least Filament First" },
                  { value: "most-first", label: "Most Filament First" },
                  { value: "name", label: "Alphabetical" },
                ]}
              />
            </div>
          )}
        </div>

        {/* Selected spool cards */}
        {derived.sortedSpools.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {derived.sortedSpools.map((sp, i) => (
              <div
                key={sp.entryId}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <div
                  className="absolute inset-y-0 left-0 w-1 rounded-l-xl"
                  style={{ backgroundColor: sp.color }}
                />
                <div className="ml-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block size-3 rounded-full ring-1 ring-white/10"
                        style={{ backgroundColor: sp.color }}
                      />
                      <span className="text-2xs font-medium text-muted-foreground">
                        {ordinal(i + 1)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => actions.removeSpool(sp.entryId)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    <span className="font-mono text-primary">#{sp.spoolNumber}</span>{" "}
                    {sp.brand ? `${sp.brand} ` : ""}
                    {sp.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="h-5 border-transparent px-1.5 text-2xs"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${sp.color} 15%, transparent)`,
                        color: sp.color,
                      }}
                    >
                      {sp.material}
                    </Badge>
                    <span className="font-mono font-semibold text-foreground">
                      {sp.grams}g
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border px-6 py-8 text-center">
            <Disc className="mb-2 size-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No spools selected
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {inventorySpools.length > 0
                ? "Select spools from your inventory below"
                : "Create spools in the Spools tab first"}
            </p>
          </div>
        )}

        {/* Available inventory spools */}
        {derived.availableSpools.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add from inventory
            </p>
            <div className="flex flex-wrap gap-1.5">
              {derived.availableSpools.map((inv) => (
                <Button
                  key={inv.id}
                  variant="outline"
                  size="xs"
                  onClick={() => actions.addSpool(inv)}
                  className="gap-1.5 border-dashed"
                >
                  <Plus className="size-3 text-primary" />
                  <span
                    className="inline-block size-2.5 rounded-full ring-1 ring-white/10"
                    style={{ backgroundColor: inv.color }}
                  />
                  <span className="font-mono text-xs text-primary">
                    #{inv.spoolNumber}
                  </span>
                  {inv.brand ? `${inv.brand} ` : ""}
                  {inv.name}
                  <span className="font-mono text-muted-foreground">
                    {inv.currentMass}g
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── Purge Config ──────────────────────────────── */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Purge Per Swap
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-48 space-y-1.5">
            <Label htmlFor="purge-length">Extrusion length (mm)</Label>
            <Input
              id="purge-length"
              type="number"
              placeholder="100"
              value={state.purgeLength}
              onChange={(e) => actions.setPurgeLength(e.target.value)}
              className="font-mono"
            />
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            ≈{" "}
            <span className="font-mono font-medium text-foreground">
              {derived.purgeGramsDisplay}g
            </span>{" "}
            per spool load
          </p>
        </div>
      </div>

      {/* ─── Actions ───────────────────────────────────── */}
      <div className="flex gap-3">
        <Button
          onClick={actions.calculate}
          className="gap-2 bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500"
        >
          <Calculator className="size-4" />
          Calculate Stop Points
        </Button>
        <Button variant="outline" onClick={actions.reset} className="gap-2">
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      {/* ─── Error Message ────────────────────────────── */}
      {state.error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      {/* ─── Results ──────────────────────────────────── */}
      {state.results && (
        <ResultsDisplay
          results={state.results}
          sortedSpools={derived.sortedSpools}
          slicerProfile={
            state.slicerOverride ?? state.gcodeMetadata?.slicer.profile ?? null
          }
          recommendations={derived.recommendations}
          onAddSpool={actions.addSpool}
        />
      )}
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
