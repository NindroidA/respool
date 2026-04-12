"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StyledSelect } from "@/components/ui/styled-select";
import { DEFAULT_MATERIALS } from "@/lib/constants";
import type { ParseResult, GcodeMetadata, ParseError, SlicerId } from "@/lib/gcode-parser";
import { SLICER_PROFILES } from "@/lib/slicer-profiles";
import {
  Upload,
  FileCode2,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
} from "lucide-react";

interface GcodeUploadProps {
  gcodeData: ParseResult | null;
  gcodeError: ParseError | null;
  gcodeMetadata: GcodeMetadata | null;
  gcodeWarnings: string[];
  gcodeName: string;
  gcodeLoading: boolean;
  density: number;
  selectedMaterial: string;
  slicerOverride: { id: SlicerId } | null;
  fileRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onChangeMaterial: (mat: string) => void;
  onSlicerOverride: (id: SlicerId | null) => void;
}

const SLICER_OPTIONS = Object.entries(SLICER_PROFILES)
  .filter(([id]) => id !== "generic")
  .map(([id, p]) => ({ value: id, label: p.name }));

export function GcodeUpload({
  gcodeData,
  gcodeError,
  gcodeMetadata,
  gcodeWarnings,
  gcodeName,
  gcodeLoading,
  density,
  selectedMaterial,
  slicerOverride,
  fileRef,
  onFileChange,
  onClear,
  onChangeMaterial,
  onSlicerOverride,
}: GcodeUploadProps) {
  if (!gcodeData && !gcodeError) {
    return (
      <label className="group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border px-6 py-12 transition-all hover:border-primary/50 hover:bg-linear-to-b hover:from-primary/5 hover:to-transparent">
        <input
          ref={fileRef}
          type="file"
          accept=".gcode,.gco,.g"
          onChange={onFileChange}
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
                Supports all major slicers: Cura, PrusaSlicer, OrcaSlicer,
                BambuStudio, Simplify3D, and more
              </p>
            </div>
          </>
        )}
      </label>
    );
  }

  // Error state
  if (gcodeError) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-300">
              Failed to parse G-code
            </p>
            <p className="mt-1 text-sm text-red-300/80">
              {gcodeError.message}
            </p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClear}>
            <X className="size-3.5" />
          </Button>
        </div>
        {/* Offer manual slicer selection */}
        <div className="flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">
            Try selecting your slicer manually:
          </Label>
          <StyledSelect
            value={slicerOverride?.id ?? ""}
            onChange={(v) => onSlicerOverride(v ? (v as SlicerId) : null)}
            placeholder="Auto-detect"
            options={[
              { value: "", label: "Auto-detect" },
              ...SLICER_OPTIONS,
            ]}
            size="sm"
            className="w-52"
          />
        </div>
      </div>
    );
  }

  // Success state — file loaded
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-primary/20 bg-linear-to-r from-primary/5 to-transparent p-4">
        {/* File info + slicer badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary/15 p-1.5">
              <FileCode2 className="size-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-medium">{gcodeName}</span>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-medium text-primary">
                  {gcodeData!.totalLayers} layers
                </span>
                <span className="text-muted-foreground">&middot;</span>
                <span className="font-mono font-medium text-primary">
                  {gcodeData!.totalGrams.toFixed(1)}g
                </span>
                {gcodeData!.headerGrams && (
                  <>
                    <span className="text-muted-foreground">&middot;</span>
                    <span className="flex items-center gap-0.5 text-emerald-400">
                      <CheckCircle2 className="size-3" />
                      slicer verified
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClear}>
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Detected slicer badge */}
        {gcodeMetadata && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={`gap-1.5 ${
                gcodeMetadata.slicer.confidence === "high"
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : gcodeMetadata.slicer.confidence === "medium"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              <Shield className="size-3" />
              {gcodeMetadata.slicer.profile.name}
              {gcodeMetadata.slicer.version && ` ${gcodeMetadata.slicer.version}`}
            </Badge>
            {gcodeMetadata.material && (
              <Badge variant="outline" className="text-xs">
                {gcodeMetadata.material}
              </Badge>
            )}
            {gcodeMetadata.color && (
              <span
                className="inline-block size-4 rounded-full border border-white/10"
                style={{ backgroundColor: gcodeMetadata.color }}
              />
            )}
            {gcodeMetadata.isMultiMaterial && (
              <Badge
                variant="outline"
                className="border-amber-500/30 bg-amber-500/10 text-xs text-amber-400"
              >
                Multi-material ({gcodeMetadata.toolChangeCount} tools)
              </Badge>
            )}
          </div>
        )}

        {/* Manual slicer override */}
        <div className="mt-3 flex items-center gap-3">
          <Label className="text-xs text-muted-foreground">Slicer:</Label>
          <StyledSelect
            value={slicerOverride?.id ?? ""}
            onChange={(v) => onSlicerOverride(v ? (v as SlicerId) : null)}
            placeholder="Auto-detect"
            options={[
              { value: "", label: `Auto-detect (${gcodeMetadata?.slicer.profile.name ?? "unknown"})` },
              ...SLICER_OPTIONS,
            ]}
            size="sm"
            className="w-56"
          />
        </div>

        {/* Material selector */}
        <div className="mt-3 space-y-2">
          <Label className="text-xs text-muted-foreground">
            Filament type ({density} g/cm³)
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_MATERIALS.map((mat) => (
              <Button
                key={mat}
                variant={selectedMaterial === mat ? "default" : "outline"}
                size="xs"
                onClick={() => onChangeMaterial(mat)}
              >
                {mat}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {gcodeWarnings.length > 0 && (
        <div className="space-y-1.5">
          {gcodeWarnings.map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300"
            >
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
