"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  parseGcode,
  type ParseResult,
  type ParseError,
  type SlicerProfile,
  type GcodeMetadata,
  SLICER_PROFILES,
  type SlicerId,
} from "@/lib/gcode-parser";
import {
  mmToGrams,
  getDensity,
  calculateSwapPointsGcode,
  calculateSwapPointsLinear,
  type SwapResult,
} from "@/lib/filament-utils";
import { MATERIAL_DENSITIES } from "@/lib/constants";

// ─── Types ──────────────────────────────────────────────

export interface InventorySpool {
  id: string;
  spoolNumber: number;
  name: string;
  brand: string;
  material: string;
  color: string;
  currentMass: number;
  startingMass: number;
}

export interface SelectedSpool {
  entryId: number;
  inventoryId: string;
  spoolNumber: number;
  name: string;
  brand: string;
  color: string;
  material: string;
  grams: number;
}

export type SortOption = "least-first" | "most-first" | "name" | "custom";

export interface CalculatorState {
  mode: "gcode" | "manual";
  totalGrams: string;
  totalLayers: string;
  selectedSpools: SelectedSpool[];
  gcodeData: ParseResult | null;
  gcodeError: ParseError | null;
  gcodeMetadata: GcodeMetadata | null;
  gcodeWarnings: string[];
  gcodeName: string;
  gcodeLoading: boolean;
  density: number;
  selectedMaterial: string;
  purgeLength: string;
  sortOption: SortOption;
  results: SwapResult | null;
  error: string | null;
  slicerOverride: SlicerProfile | null;
}

export interface CalculatorActions {
  setMode: (mode: "gcode" | "manual") => void;
  setTotalGrams: (v: string) => void;
  setTotalLayers: (v: string) => void;
  addSpool: (inv: InventorySpool) => void;
  removeSpool: (entryId: number) => void;
  handleFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  changeMaterial: (mat: string) => void;
  clearGcode: () => void;
  calculate: () => void;
  reset: () => void;
  setPurgeLength: (v: string) => void;
  setSortOption: (v: SortOption) => void;
  setSlicerOverride: (id: SlicerId | null) => void;
  fileRef: React.RefObject<HTMLInputElement | null>;
}

export interface CalculatorDerived {
  availableSpools: InventorySpool[];
  sortedSpools: SelectedSpool[];
  purgeGramsDisplay: string;
  recommendations: {
    deficit: number;
    spools: InventorySpool[];
    canCover: boolean;
  } | null;
}

// ─── Hook ───────────────────────────────────────────────

export function useCalculator(inventorySpools: InventorySpool[]): {
  state: CalculatorState;
  actions: CalculatorActions;
  derived: CalculatorDerived;
} {
  const [mode, setMode] = useState<"gcode" | "manual">("gcode");
  const [totalGrams, setTotalGrams] = useState("");
  const [totalLayers, setTotalLayers] = useState("");
  const [selectedSpools, setSelectedSpools] = useState<SelectedSpool[]>([]);
  const [nextEntryId, setNextEntryId] = useState(1);
  const [gcodeData, setGcodeData] = useState<ParseResult | null>(null);
  const [gcodeError, setGcodeError] = useState<ParseError | null>(null);
  const [gcodeMetadata, setGcodeMetadata] = useState<GcodeMetadata | null>(
    null,
  );
  const [gcodeWarnings, setGcodeWarnings] = useState<string[]>([]);
  const [gcodeName, setGcodeName] = useState("");
  const [gcodeLoading, setGcodeLoading] = useState(false);
  const [density, setDensity] = useState(MATERIAL_DENSITIES.PLA);
  const [selectedMaterial, setSelectedMaterial] = useState("PLA");
  const [purgeLength, setPurgeLength] = useState("100");
  const [sortOption, setSortOption] = useState<SortOption>("custom");
  const [results, setResults] = useState<SwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slicerOverride, setSlicerOverrideState] =
    useState<SlicerProfile | null>(null);
  const [gcodeRaw, setGcodeRaw] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // ─── Derived State ──────────────────────────────────

  const availableSpools = useMemo(
    () =>
      inventorySpools.filter(
        (inv) => !selectedSpools.some((s) => s.inventoryId === inv.id),
      ),
    [inventorySpools, selectedSpools],
  );

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

  const purgeGramsDisplay = mmToGrams(
    parseFloat(purgeLength) || 0,
    density,
  ).toFixed(1);

  const recommendations = useMemo(() => {
    if (!results || results.enough) return null;
    const deficit = results.totalWithPurge - results.totalAvailable;
    const candidates = availableSpools
      .filter((s) => s.currentMass > 0)
      .sort((a, b) => b.currentMass - a.currentMass);

    if (candidates.length === 0)
      return { deficit: Math.round(deficit), spools: [], canCover: false };

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

  // ─── Actions ────────────────────────────────────────

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

  const runParse = (
    raw: string,
    d: number,
    fileName: string,
    override?: SlicerProfile | null,
  ) => {
    const result = parseGcode(raw, d, {
      slicerOverride: override ?? undefined,
      fileName,
    });

    if ("type" in result) {
      // ParseError
      setGcodeError(result);
      setGcodeData(null);
      setGcodeMetadata(null);
      setGcodeWarnings([]);
      setError(result.message);
      return;
    }

    setGcodeData(result);
    setGcodeError(null);
    setGcodeMetadata(result.metadata);
    setGcodeWarnings(result.warnings);
    setTotalGrams(result.totalGrams.toFixed(1));
    setTotalLayers(String(result.totalLayers));
    setError(null);

    // Auto-fill density/material from metadata
    if (result.metadata.density && result.metadata.material) {
      setDensity(result.metadata.density);
      setSelectedMaterial(result.metadata.material);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setGcodeLoading(true);
    setGcodeName(file.name);
    setError(null);
    setGcodeError(null);
    setResults(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      setGcodeRaw(raw);
      runParse(raw, density, file.name, slicerOverride);
      setGcodeLoading(false);
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
      setGcodeLoading(false);
    };
    reader.readAsText(file);
  };

  const changeMaterial = (mat: string) => {
    const d = getDensity(mat);
    setSelectedMaterial(mat);
    setDensity(d);
    if (gcodeRaw) {
      runParse(gcodeRaw, d, gcodeName, slicerOverride);
    }
  };

  const setSlicerOverride = (id: SlicerId | null) => {
    const profile = id ? SLICER_PROFILES[id] : null;
    setSlicerOverrideState(profile);
    if (gcodeRaw) {
      runParse(gcodeRaw, density, gcodeName, profile);
    }
  };

  const clearGcode = () => {
    setGcodeData(null);
    setGcodeError(null);
    setGcodeRaw(null);
    setGcodeName("");
    setGcodeMetadata(null);
    setGcodeWarnings([]);
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
    clearGcode(); // clears gcode state, totalGrams, totalLayers, results, error
    setSelectedSpools([]);
    setSlicerOverrideState(null);
    setMode("gcode");
    setPurgeLength("100");
    setSelectedMaterial("PLA");
    setDensity(MATERIAL_DENSITIES.PLA);
    setSortOption("custom");
  };

  return {
    state: {
      mode,
      totalGrams,
      totalLayers,
      selectedSpools,
      gcodeData,
      gcodeError,
      gcodeMetadata,
      gcodeWarnings,
      gcodeName,
      gcodeLoading,
      density,
      selectedMaterial,
      purgeLength,
      sortOption,
      results,
      error,
      slicerOverride,
    },
    actions: {
      setMode: (m) => {
        setMode(m);
        setResults(null);
        setError(null);
      },
      setTotalGrams,
      setTotalLayers,
      addSpool,
      removeSpool,
      handleFile,
      changeMaterial,
      clearGcode,
      calculate,
      reset,
      setPurgeLength,
      setSortOption,
      setSlicerOverride,
      fileRef,
    },
    derived: {
      availableSpools,
      sortedSpools,
      purgeGramsDisplay,
      recommendations,
    },
  };
}
