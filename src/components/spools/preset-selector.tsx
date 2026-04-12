"use client";

import { useState, useEffect } from "react";
import { suggestPresets } from "@/app/(dashboard)/presets/actions";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";

interface Preset {
  id: string;
  name: string;
  brand: string;
  material: string;
  color: string;
  colorSecondary: string | null;
  filamentColorId: string | null;
  startingMass: number;
  diameter: number | null;
  printingTemperature: number | null;
  bedTemperature: number | null;
  purchaseLink: string | null;
  estimatedCost: number | null;
  timesUsed: number;
}

interface PresetSelectorProps {
  onSelect: (preset: Preset) => void;
}

export function PresetSelector({ onSelect }: PresetSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const presets = await suggestPresets(query);
        setResults(presets as Preset[]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-(--accent-jade-muted) p-3">
        <Sparkles className="h-4 w-4 shrink-0 text-jade" />
        <div className="flex-1">
          <p className="mb-1.5 text-xs font-medium text-jade">
            Quick Fill from Preset
          </p>
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-(--text-faint)" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 200)}
              placeholder="Search presets by name, brand, material..."
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute right-0 left-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-(--bg-card) shadow-lg">
          {results.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-(--bg-card-hover)"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(preset);
                setQuery("");
                setOpen(false);
              }}
            >
              <div
                className="h-4 w-4 shrink-0 rounded-full border border-white/10"
                style={{ backgroundColor: preset.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {preset.name}
                </p>
                <p className="text-xs text-(--text-muted)">
                  {preset.material} &middot; {preset.brand} &middot;{" "}
                  {preset.startingMass}g
                  {preset.printingTemperature &&
                    ` · ${preset.printingTemperature}°C`}
                </p>
              </div>
              {preset.timesUsed > 0 && (
                <span className="text-xs text-(--text-faint)">
                  {preset.timesUsed}x
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && loading && (
        <div className="absolute right-0 left-0 z-50 mt-1 rounded-lg border border-border bg-(--bg-card) p-3 text-center text-sm text-(--text-muted) shadow-lg">
          Searching...
        </div>
      )}
    </div>
  );
}
