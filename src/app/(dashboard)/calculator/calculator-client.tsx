"use client";

import { useState, useCallback, useRef } from "react";
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
  Plus,
  Trash2,
  Calculator,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Pause,
  ChevronRight,
  Layers,
  Zap,
  Info,
} from "lucide-react";

interface InventorySpool {
  id: string;
  name: string;
  brand: string;
  material: string;
  color: string;
  currentMass: number;
  startingMass: number;
}

interface SpoolEntry {
  id: number;
  grams: string;
  inventorySpoolId?: string;
  label?: string;
}

interface Props {
  inventorySpools: InventorySpool[];
}

export function CalculatorClient({ inventorySpools }: Props) {
  const [mode, setMode] = useState<"gcode" | "manual">("gcode");
  const [totalGrams, setTotalGrams] = useState("");
  const [totalLayers, setTotalLayers] = useState("");
  const [spools, setSpools] = useState<SpoolEntry[]>([{ id: 1, grams: "" }]);
  const [nextId, setNextId] = useState(2);
  const [gcodeData, setGcodeData] = useState<ParseResult | null>(null);
  const [gcodeRaw, setGcodeRaw] = useState<string | null>(null);
  const [gcodeName, setGcodeName] = useState("");
  const [gcodeLoading, setGcodeLoading] = useState(false);
  const [density, setDensity] = useState(MATERIAL_DENSITIES.PLA);
  const [selectedMaterial, setSelectedMaterial] = useState("PLA");
  const [purgeLength, setPurgeLength] = useState("100");
  const [results, setResults] = useState<SwapResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addSpool = () => {
    setSpools((s) => [...s, { id: nextId, grams: "" }]);
    setNextId((n) => n + 1);
  };

  const addFromInventory = (inv: InventorySpool) => {
    setSpools((s) => [
      ...s,
      {
        id: nextId,
        grams: String(inv.currentMass),
        inventorySpoolId: inv.id,
        label: `${inv.brand ? inv.brand + " " : ""}${inv.name}`,
      },
    ]);
    setNextId((n) => n + 1);
  };

  const removeSpool = (id: number) =>
    setSpools((s) => s.filter((sp) => sp.id !== id));

  const updateSpoolGrams = (id: number, val: string) =>
    setSpools((s) =>
      s.map((sp) => (sp.id === id ? { ...sp, grams: val } : sp)),
    );

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGcodeLoading(true);
    setGcodeName(file.name);
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
    if (fileRef.current) fileRef.current.value = "";
  };

  const calculate = useCallback(() => {
    const total = parseFloat(totalGrams);
    const layers = parseInt(totalLayers);
    const spoolWeights = spools
      .map((s) => parseFloat(s.grams))
      .filter((g) => !isNaN(g) && g > 0);

    if (isNaN(total) || total <= 0 || isNaN(layers) || layers <= 0) return;
    if (spoolWeights.length === 0) return;

    const purgeGrams = mmToGrams(parseFloat(purgeLength) || 0, density);

    if (gcodeData && mode === "gcode") {
      setResults(
        calculateSwapPointsGcode(
          gcodeData.layers,
          spoolWeights,
          purgeGrams,
          layers,
        ),
      );
    } else {
      setResults(
        calculateSwapPointsLinear(total, layers, spoolWeights, purgeGrams),
      );
    }
  }, [totalGrams, totalLayers, spools, gcodeData, mode, purgeLength, density]);

  const reset = () => {
    setTotalGrams("");
    setTotalLayers("");
    setSpools([{ id: 1, grams: "" }]);
    setResults(null);
    clearGcode();
    setMode("gcode");
    setPurgeLength("100");
    setSelectedMaterial("PLA");
    setDensity(MATERIAL_DENSITIES.PLA);
  };

  const purgeGramsDisplay = mmToGrams(
    parseFloat(purgeLength) || 0,
    density,
  ).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Spool Swap Calculator
        </h1>
        <p className="text-sm text-muted-foreground">
          Figure out where to pause &amp; swap partial spools
        </p>
      </div>

      {/* Mode Toggle */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "gcode" | "manual")}
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
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-6 py-10 transition-colors hover:border-primary/50 hover:bg-card/50">
              <input
                ref={fileRef}
                type="file"
                accept=".gcode,.gco,.g"
                onChange={handleFile}
                className="hidden"
              />
              {gcodeLoading ? (
                <>
                  <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">
                    Parsing G-code...
                  </span>
                </>
              ) : (
                <>
                  <Upload className="size-8 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Click to select <span className="text-primary">.gcode</span>{" "}
                    file
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Parses per-layer extrusion for accurate swap points
                  </span>
                </>
              )}
            </label>
          ) : (
            <Card>
              <CardContent className="space-y-4">
                {/* File info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="size-4 text-primary" />
                    <span className="text-sm font-medium">{gcodeName}</span>
                  </div>
                  <Button variant="ghost" size="icon-xs" onClick={clearGcode}>
                    <X className="size-3.5" />
                  </Button>
                </div>

                {/* Parsed stats */}
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-primary font-medium">
                    {gcodeData.totalLayers} layers
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-primary font-medium">
                    {gcodeData.totalGrams.toFixed(1)}g total
                  </span>
                  {gcodeData.headerGrams && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="flex items-center gap-1 text-emerald-accent">
                        <CheckCircle2 className="size-3" />
                        matched slicer header
                      </span>
                    </>
                  )}
                </div>

                {/* Material selector */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Filament type
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_MATERIALS.map((mat) => (
                      <Button
                        key={mat}
                        variant={
                          selectedMaterial === mat ? "default" : "outline"
                        }
                        size="xs"
                        onClick={() => changeMaterial(mat)}
                      >
                        {mat}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Density: {density} g/cm³
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Parsed print info (read-only) */}
          {gcodeData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Total filament
                </Label>
                <div className="flex h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-primary">
                  {totalGrams}g
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Total layers
                </Label>
                <div className="flex h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-primary">
                  {totalLayers}
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
              />
              <p className="text-xs text-muted-foreground">
                From your slicer preview
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Spools Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Your Spools
            </h2>
            <p className="text-xs text-muted-foreground">
              In print order — first spool loads first
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={addSpool}>
            <Plus className="mr-1 size-3.5" />
            Add Spool
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {spools.map((sp, i) => (
            <Card key={sp.id} size="sm">
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    Spool {i + 1}
                    {sp.label && (
                      <span className="ml-1.5 font-normal text-primary">
                        — {sp.label}
                      </span>
                    )}
                  </span>
                  {spools.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeSpool(sp.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="grams remaining"
                  value={sp.grams}
                  onChange={(e) => updateSpoolGrams(sp.id, e.target.value)}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Inventory Picker */}
        {inventorySpools.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Or add from your inventory:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {inventorySpools.map((inv) => (
                <Button
                  key={inv.id}
                  variant="outline"
                  size="xs"
                  onClick={() => addFromInventory(inv)}
                  className="gap-1.5"
                >
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: inv.color }}
                  />
                  {inv.brand ? `${inv.brand} ` : ""}
                  {inv.name}
                  <span className="text-muted-foreground">
                    {inv.currentMass}g
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Purge Config */}
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
            />
          </div>
          <p className="pb-2 text-xs text-muted-foreground">
            ≈ {purgeGramsDisplay}g per spool load — filament extruded each time
            you load/swap a spool
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={calculate} className="gap-2">
          <Calculator className="size-4" />
          Calculate Stop Points
        </Button>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>

      {/* Results */}
      {results && <ResultsDisplay results={results} />}
    </div>
  );
}

function ResultsDisplay({ results }: { results: SwapResult }) {
  return (
    <div className="space-y-6 border-t border-border pt-6">
      {/* Results header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
        <StatBox value={`${results.totalAvailable}g`} label="available" />
        <StatBox value={`${results.totalNeeded}g`} label="print needs" />
        {results.totalPurgeWaste > 0 && (
          <StatBox
            value={`+${results.totalPurgeWaste}g`}
            label={`purge waste (${results.numSwaps + 1} loads × ${results.purgePerSwap}g)`}
            className="text-amber-400"
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
          className={results.enough ? "text-emerald-400" : "text-red-400"}
          borderColor={
            results.enough ? "border-emerald-500/30" : "border-red-500/30"
          }
        />
      </div>

      {/* Pause Schedule */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Pause Schedule
        </h3>
        <div className="space-y-2">
          {results.schedule.map((s, i) => (
            <Card key={i} size="sm">
              <CardContent>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-35 flex-1">
                    <span className="text-sm font-semibold text-primary">
                      Spool {s.spool}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {s.gramsAvailable}g available → {s.gramsUsed}g print
                      {s.purgeGrams > 0 ? ` + ${s.purgeGrams}g purge` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-secondary-foreground">
                    Layer {s.startLayer} – {s.endLayer}
                  </span>
                  <div className="ml-auto">
                    {s.pauseBeforeLayer ? (
                      <Badge className="gap-1 bg-amber-500/15 text-amber-400 border-amber-500/30">
                        <Pause className="size-3" />
                        PAUSE before layer {s.pauseBeforeLayer}
                      </Badge>
                    ) : (
                      <Badge className="gap-1 bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="size-3" />
                        DONE
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.layersCovered < results.totalLayers && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Only covers {results.layersCovered} of {results.totalLayers}{" "}
              layers. You need more filament for layers{" "}
              {results.layersCovered + 1}–{results.totalLayers}.
            </span>
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground">
            <Zap className="size-4 text-primary" />
            Quick Ref — Set these markers in EufyMake Studio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {results.schedule.filter((s) => s.pauseBeforeLayer).length > 0 ? (
            <>
              {results.schedule
                .filter((s) => s.pauseBeforeLayer)
                .map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Set marker on</span>
                    <span className="font-bold text-amber-400">
                      layer {s.pauseBeforeLayer}
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                    <span className="text-secondary-foreground">
                      Swap Spool {s.spool} → Spool {s.spool + 1}
                    </span>
                  </div>
                ))}
              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3 shrink-0" />
                EufyMake pauses <em>before</em> printing the marked layer — set
                the marker on the first layer of the next spool.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No pauses needed — single spool covers the whole print.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({
  value,
  label,
  className,
  borderColor,
  icon: Icon,
}: {
  value: string;
  label: string;
  className?: string;
  borderColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div
      className={`rounded-lg border bg-card p-3 text-center ${borderColor ?? "border-border"}`}
    >
      <div
        className={`flex items-center justify-center gap-1 text-lg font-bold ${className ?? "text-foreground"}`}
      >
        {Icon && <Icon className="size-4" />}
        {value}
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
