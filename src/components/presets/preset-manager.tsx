"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PresetForm } from "./preset-form";
import { deletePreset } from "@/app/(dashboard)/presets/actions";
import { MATERIAL_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { Search, Trash2, Pencil, Plus, Package } from "lucide-react";

interface FilamentColor {
  id: string;
  name: string;
  category: string;
}

interface Preset {
  id: string;
  userId: string | null;
  name: string;
  source: string;
  brand: string;
  material: string;
  color: string;
  colorSecondary: string | null;
  filamentColorId: string | null;
  filamentColor: { id: string; name: string; category: string } | null;
  startingMass: number;
  diameter: number | null;
  printingTemperature: number | null;
  bedTemperature: number | null;
  purchaseLink: string | null;
  estimatedCost: number | null;
  timesUsed: number;
  lastUsedAt: Date | null;
}

interface PresetManagerProps {
  presets: Preset[];
  colors: FilamentColor[];
}

export function PresetManager({ presets, colors }: PresetManagerProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"user" | "community">("user");

  const filtered = presets.filter((p) => {
    const matchesTab =
      tab === "user" ? p.userId !== null : p.source === "community";
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.material.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete preset "${name}"?`)) return;
    try {
      await deletePreset(id);
      toast.success("Preset deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      {/* Tabs + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-border bg-(--bg-surface) p-1">
          <button
            onClick={() => setTab("user")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "user"
                ? "bg-(--accent-jade-muted) text-jade"
                : "text-(--text-muted) hover:text-foreground"
            }`}
          >
            My Presets
          </button>
          <button
            onClick={() => setTab("community")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "community"
                ? "bg-(--accent-jade-muted) text-jade"
                : "text-(--text-muted) hover:text-foreground"
            }`}
          >
            Community Library
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-(--text-faint)" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search presets..."
              className="h-9 w-56 pl-9"
            />
          </div>
          <PresetForm colors={colors}>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Preset
            </Button>
          </PresetForm>
        </div>
      </div>

      {/* Preset List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12 text-center">
          <Package className="mb-3 h-10 w-10 text-(--text-faint)" />
          <p className="text-sm font-medium text-foreground">
            {tab === "user" ? "No presets yet" : "No community presets"}
          </p>
          <p className="mt-1 text-xs text-(--text-muted)">
            {tab === "user"
              ? "Create your first preset to speed up spool creation."
              : "Community presets will appear here once seeded."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((preset) => {
            const mc = MATERIAL_COLORS[preset.material];
            return (
              <div
                key={preset.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-(--bg-card-hover)"
              >
                {/* Color swatch */}
                <div
                  className="h-10 w-10 shrink-0 rounded-lg border border-white/10"
                  style={{ backgroundColor: preset.color }}
                />

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">
                      {preset.name}
                    </p>
                    {preset.source !== "user" && (
                      <Badge variant="outline" className="text-2xs">
                        {preset.source}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-(--text-muted)">
                    <Badge
                      variant="outline"
                      className="border-transparent text-2xs font-semibold"
                      style={{
                        backgroundColor: mc
                          ? `${mc.primary}18`
                          : "var(--bg-surface)",
                        color: mc?.light ?? "var(--text-secondary)",
                      }}
                    >
                      {preset.material}
                    </Badge>
                    <span>{preset.brand}</span>
                    <span>&middot;</span>
                    <span>{preset.startingMass}g</span>
                    {preset.printingTemperature && (
                      <>
                        <span>&middot;</span>
                        <span>{preset.printingTemperature}°C</span>
                      </>
                    )}
                    {preset.diameter && (
                      <>
                        <span>&middot;</span>
                        <span>{preset.diameter}mm</span>
                      </>
                    )}
                  </div>
                  {preset.timesUsed > 0 && (
                    <p className="mt-1 text-2xs text-(--text-faint)">
                      Used {preset.timesUsed} time
                      {preset.timesUsed !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {preset.userId && (
                  <div className="flex items-center gap-1">
                    <PresetForm preset={preset} colors={colors}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </PresetForm>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-(--color-error) hover:bg-(--color-error-muted)"
                      onClick={() => handleDelete(preset.id, preset.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
