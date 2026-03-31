"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { parseGcode, type ParseResult } from "@/lib/gcode-parser";
import {
  mmToGrams,
  getDensity,
  calculateSwapPointsGcode,
  calculateSwapPointsLinear,
  type SwapResult,
} from "@/lib/filament-utils";
import { MATERIAL_DENSITIES, DEFAULT_MATERIALS } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Upload,
  FileCode2,
  X,
  Trash2,
  Calculator,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pause,
  ArrowRight,
  Layers,
  Zap,
  Info,
  Plus,
  Disc,
} from "lucide-react";
import { StyledSelect } from "@/components/ui/styled-select";

// ─── Types ──────────────────────────────────────────

interface InventorySpool {
  id: string;
  spoolNumber: number;
  name: string;
  brand: string;
  material: string;
  color: string;
  currentMass: number;
  startingMass: number;
}

interface SelectedSpool {
  entryId: number;
  inventoryId: string;
  spoolNumber: number;
  name: string;
  brand: string;
  color: string;
  material: string;
  grams: number;
}

type SortOption = "least-first" | "most-first" | "name" | "custom";

interface Props {
  inventorySpools: InventorySpool[];
}

// ─── Main Component ─────────────────────────────────

export function CalculatorClient({ inventorySpools }: Props) {
  const [mode, setMode] = useState<"gcode" | "manual">("gcode");
  const [totalGrams, setTotalGrams] = useState("");
  const [totalLayers, setTotalLayers] = useState("");
  const [selectedSpools, setSelectedSpools] = useState<SelectedSpool[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  const [gcodeData, setGcodeData] = useState<ParseResult | null>(null);
  const [gcodeRaw, setGcodeRaw] = useState<string | null>(null);
  const [gcodeName, setGcodeName] = useState("");
  const [gcodeLoading, setGcodeLoading] = useState(false);
  const [density, setDensity] = useState(MATERIAL_DENSITIES.PLA);
  const [selectedMaterial, setSelectedMaterial] = useState("PLA");
  const [purgeLength, setPurgeLength] = useState("100");
  const [sortOption, setSortOption] = useState<SortOption>("custom");
  const [results, setResults] = useState<SwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Spools not yet selected
  const availableSpools = useMemo(
    () =>
      inventorySpools.filter(
        (inv) => !selectedSpools.some((s) => s.inventoryId === inv.id),
      ),
    [inventorySpools, selectedSpools],
  );

  // Sorted selected spools
  const sortedSpools = useMemo(() => {
    const sorted = [...selectedSpools];
    switch (sortOption) {
      case "least-first":
        sorted.sort((a, b) => a.grams - b.grams);
        break;
      case "most-first":
        sorted.sort((a, b) => b.grams - a.grams);
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [selectedSpools, sortOption]);

  const addSpool = (inv: InventorySpool) => {
    setSelectedSpools((prev) => [
      ...prev,
      {
        entryId: nextEntryId,
        inventoryId: inv.id,
        spoolNumber: inv.spoolNumber,
        name: inv.name,
        brand: inv.brand,
        color: inv.color,
        material: inv.material,
        grams: inv.currentMass,
      },
    ]);
    setNextEntryId((n) => n + 1);
    setResults(null);
    setError(null);
  };

  const removeSpool = (entryId: number) => {
    setSelectedSpools((prev) => prev.filter((s) => s.entryId !== entryId));
    setResults(null);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGcodeLoading(true);
    setGcodeName(file.name);
    setError(null);
    setResults(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      setGcodeRaw(raw);
      const parsed = parseGcode(raw, density);
      setGcodeData(parsed);
      setTotalGrams(parsed.totalGrams.toFixed(1));
      setTotalLayers(String(parsed.totalLayers));
      setGcodeLoading(false);
    };
    reader.readAsText(file);
  };

  const changeMaterial = (mat: string) => {
    const d = getDensity(mat);
    setSelectedMaterial(mat);
    setDensity(d);
    if (gcodeRaw) {
      const parsed = parseGcode(gcodeRaw, d);
      setGcodeData(parsed);
      setTotalGrams(parsed.totalGrams.toFixed(1));
      setTotalLayers(String(parsed.totalLayers));
    }
  };

  const clearGcode = () => {
    setGcodeData(null);
    setGcodeRaw(null);
    setGcodeName("");
    setTotalGrams("");
    setTotalLayers("");
    setResults(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const calculate = useCallback(() => {
    setError(null);
    const total = parseFloat(totalGrams);
    const layers = parseInt(totalLayers);

    if (isNaN(total) || total <= 0 || isNaN(layers) || layers <= 0) {
      setError(
        mode === "gcode"
          ? "Upload a G-code file first to get print data."
          : "Enter the total filament (grams) and layer count from your slicer.",
      );
      return;
    }

    if (sortedSpools.length === 0) {
      setError("Select at least one spool from your inventory.");
      return;
    }

    const spoolWeights = sortedSpools.map((s) => s.grams);
    const purgeGrams = mmToGrams(parseFloat(purgeLength) || 0, density);

    let result: SwapResult;
    if (gcodeData && mode === "gcode") {
      result = calculateSwapPointsGcode(
        gcodeData.layers,
        spoolWeights,
        purgeGrams,
        layers,
      );
    } else {
      result = calculateSwapPointsLinear(
        total,
        layers,
        spoolWeights,
        purgeGrams,
      );
    }

    setResults(result);
  }, [
    totalGrams,
    totalLayers,
    sortedSpools,
    gcodeData,
    mode,
    purgeLength,
    density,
  ]);

  const reset = () => {
    setTotalGrams("");
    setTotalLayers("");
    setSelectedSpools([]);
    setResults(null);
    setError(null);
    clearGcode();
    setMode("gcode");
    setPurgeLength("100");
    setSelectedMaterial("PLA");
    setDensity(MATERIAL_DENSITIES.PLA);
    setSortOption("custom");
  };

  const purgeGramsDisplay = mmToGrams(
    parseFloat(purgeLength) || 0,
    density,
  ).toFixed(1);

  // Recommendation: spools the user could add to cover the deficit
  const recommendations = useMemo(() => {
    if (!results || results.enough) return null;
    const deficit = results.totalWithPurge - results.totalAvailable;
    const candidates = availableSpools
      .filter((s) => s.currentMass > 0)
      .sort((a, b) => b.currentMass - a.currentMass);

    if (candidates.length === 0)
      return { deficit, spools: [], canCover: false };

    const recommended: InventorySpool[] = [];
    let remaining = deficit;
    for (const spool of candidates) {
      if (remaining <= 0) break;
      recommended.push(spool);
      remaining -= spool.currentMass;
    }

    return {
      deficit: Math.round(deficit),
      spools: recommended,
      canCover: remaining <= 0,
    };
  }, [results, availableSpools]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Spool Swap Calculator
          </h1>
          <p className="text-sm text-muted-foreground">
            Figure out exactly where to pause &amp; swap partial spools
          </p>
        </div>
      </div>

      {/* Slicer Compatibility Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 to-teal-500/5 px-4 py-3">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <div className="text-sm">
          <span className="font-medium text-primary">
            Currently optimized for EufyMake Studio / AnkerMake G-code.
          </span>{" "}
          <span className="text-muted-foreground">
            Support for PrusaSlicer, OrcaSlicer, and Cura is coming soon. Manual
            entry mode works with any slicer.
          </span>
        </div>
      </div>

      {/* Mode Toggle */}
      <Tabs
        value={mode}
        onValueChange={(v) => {
          setMode(v as "gcode" | "manual");
          setResults(null);
          setError(null);
        }}
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
        <TabsContent value="gcode" className="mt-4 space-y-4">
          {!gcodeData ? (
            <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-12 transition-all hover:border-primary/50 hover:bg-linear-to-b hover:from-primary/5 hover:to-transparent">
              <input
                ref={fileRef}
                type="file"
                accept=".gcode,.gco,.g"
                onChange={handleFile}
                className="hidden"
              />
              {gcodeLoading ? (
                <>
                  <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">
                    Parsing G-code...
                  </span>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                    <Upload className="size-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-medium text-foreground">
                      Drop or click to select{" "}
                      <span className="text-primary">.gcode</span> file
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Parses per-layer extrusion for accurate swap points
                    </p>
                  </div>
                </>
              )}
            </label>
          ) : (
            <div className="rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 to-transparent p-4">
              {/* File info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-lg bg-primary/15 p-1.5">
                    <FileCode2 className="size-4 text-primary" />
                  </div>
                  <div>
                    <span className="text-sm font-medium">{gcodeName}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-medium text-primary">
                        {gcodeData.totalLayers} layers
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="font-mono font-medium text-primary">
                        {gcodeData.totalGrams.toFixed(1)}g
                      </span>
                      {gcodeData.headerGrams && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="flex items-center gap-0.5 text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            slicer verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon-xs" onClick={clearGcode}>
                  <X className="size-3.5" />
                </Button>
              </div>

              {/* Material selector */}
              <div className="mt-4 space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Filament type ({density} g/cm³)
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_MATERIALS.map((mat) => (
                    <Button
                      key={mat}
                      variant={selectedMaterial === mat ? "default" : "outline"}
                      size="xs"
                      onClick={() => changeMaterial(mat)}
                    >
                      {mat}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
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
                value={totalGrams}
                onChange={(e) => setTotalGrams(e.target.value)}
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
                value={totalLayers}
                onChange={(e) => setTotalLayers(e.target.value)}
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
          {selectedSpools.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-muted-foreground">Sort:</Label>
              <StyledSelect
                value={sortOption}
                onChange={(v) => setSortOption(v as SortOption)}
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
        {sortedSpools.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sortedSpools.map((sp, i) => (
              <div
                key={sp.entryId}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                {/* Color accent bar */}
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
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {ordinal(i + 1)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => removeSpool(sp.entryId)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    <span className="font-mono text-primary">
                      #{sp.spoolNumber}
                    </span>{" "}
                    {sp.brand ? `${sp.brand} ` : ""}
                    {sp.name}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="h-5 border-transparent px-1.5 text-[10px]"
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
        {availableSpools.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Add from inventory
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableSpools.map((inv) => (
                <Button
                  key={inv.id}
                  variant="outline"
                  size="xs"
                  onClick={() => addSpool(inv)}
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
              value={purgeLength}
              onChange={(e) => setPurgeLength(e.target.value)}
              className="font-mono"
            />
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            ≈{" "}
            <span className="font-mono font-medium text-foreground">
              {purgeGramsDisplay}g
            </span>{" "}
            per spool load — filament extruded each time you load/swap
          </p>
        </div>
      </div>

      {/* ─── Actions ───────────────────────────────────── */}
      <div className="flex gap-3">
        <Button
          onClick={calculate}
          className="gap-2 bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500"
        >
          <Calculator className="size-4" />
          Calculate Stop Points
        </Button>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      {/* ─── Error Message ────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ─── Results ──────────────────────────────────── */}
      {results && (
        <ResultsDisplay
          results={results}
          sortedSpools={sortedSpools}
          recommendations={recommendations}
          onAddSpool={addSpool}
        />
      )}
    </div>
  );
}

// ─── Results Component ────────────────────────────────

function ResultsDisplay({
  results,
  sortedSpools,
  recommendations,
  onAddSpool,
}: {
  results: SwapResult;
  sortedSpools: SelectedSpool[];
  recommendations: {
    deficit: number;
    spools: InventorySpool[];
    canCover: boolean;
  } | null;
  onAddSpool: (inv: InventorySpool) => void;
}) {
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
        <StatBox
          value={`${results.totalAvailable}g`}
          label="available"
          accent="emerald"
        />
        <StatBox
          value={`${results.totalNeeded}g`}
          label="print needs"
          accent="teal"
        />
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
                <span className="font-mono">{recommendations.deficit}g</span>{" "}
                more.
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
                  Create more spools in the Spools tab.
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
                  <span className="font-mono text-muted-foreground">
                    {spool.currentMass}g
                  </span>
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
            Layers {results.layersCovered + 1}–{results.totalLayers} need more
            filament.
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
                {/* Color bar */}
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
                      <span className="font-mono">{s.gramsAvailable}g</span>{" "}
                      available →{" "}
                      <span className="font-mono">{s.gramsUsed}g</span> print
                      {s.purgeGrams > 0 && (
                        <>
                          {" "}
                          + <span className="font-mono">
                            {s.purgeGrams}g
                          </span>{" "}
                          purge
                        </>
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

      {/* Quick Reference — EufyMake markers */}
      {results.schedule.some((s) => s.pauseBeforeLayer) && (
        <div className="overflow-hidden rounded-xl border border-primary/20 bg-linear-to-br from-primary/5 via-transparent to-teal-500/5">
          <div className="border-b border-primary/10 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
              <Zap className="size-4" />
              EufyMake Studio — Set These Markers
            </h3>
          </div>
          <div className="space-y-3 p-4">
            {results.schedule
              .filter((s) => s.pauseBeforeLayer)
              .map((s, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-2 text-sm"
                >
                  <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-mono font-bold text-amber-400">
                    Layer {s.pauseBeforeLayer}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="text-foreground">
                    Swap from{" "}
                    <span className="font-semibold text-primary">
                      Spool {s.spool}
                    </span>{" "}
                    to{" "}
                    <span className="font-semibold text-primary">
                      Spool {s.spool + 1}
                    </span>
                  </span>
                </div>
              ))}
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-card/50 px-3 py-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
              <span>
                In EufyMake Studio, drag the layer slider to the layer number
                shown above and click the <strong>+</strong> button to set a
                marker. The printer will <strong>pause before printing</strong>{" "}
                that layer, giving you time to swap the spool.
              </span>
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

// ─── Stat Box ─────────────────────────────────────────

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

  const colorClass = accent
    ? colors[accent]
    : "border-border from-card text-foreground";

  return (
    <div
      className={`rounded-xl border bg-linear-to-b to-card p-3 text-center ${colorClass}`}
    >
      <div className="flex items-center justify-center gap-1 font-mono text-lg font-bold">
        {Icon && <Icon className="size-4" />}
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
