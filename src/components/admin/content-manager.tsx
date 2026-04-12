"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteFilamentColor } from "@/app/(dashboard)/admin/content/actions";
import { MATERIAL_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { Trash2, Palette } from "lucide-react";

interface Color {
  id: string;
  name: string;
  hex: string;
  hexSecondary: string | null;
  category: string;
  sortOrder: number;
  spoolCount: number;
}

interface MaterialStat {
  material: string;
  count: number;
  totalMass: number;
  currentMass: number;
}

interface ContentManagerProps {
  colors: Color[];
  materialStats: MaterialStat[];
}

export function ContentManager({ colors, materialStats }: ContentManagerProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"colors" | "materials">("colors");

  async function handleDeleteColor(id: string, name: string) {
    if (!confirm(`Delete color "${name}"?`)) return;
    try {
      await deleteFilamentColor(id);
      toast.success("Color deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  // Group colors by category
  const colorsByCategory: Record<string, Color[]> = {};
  for (const c of colors) {
    if (!colorsByCategory[c.category]) colorsByCategory[c.category] = [];
    colorsByCategory[c.category].push(c);
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-(--bg-surface) p-1">
        <button
          onClick={() => setTab("colors")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "colors"
              ? "bg-(--accent-jade-muted) text-jade"
              : "text-(--text-muted) hover:text-foreground"
          }`}
        >
          Filament Colors ({colors.length})
        </button>
        <button
          onClick={() => setTab("materials")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "materials"
              ? "bg-(--accent-jade-muted) text-jade"
              : "text-(--text-muted) hover:text-foreground"
          }`}
        >
          Materials ({materialStats.length})
        </button>
      </div>

      {tab === "colors" && (
        <div className="space-y-6">
          {Object.entries(colorsByCategory).map(([category, catColors]) => (
            <div key={category}>
              <p className="mb-2 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
                {category} ({catColors.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {catColors.map((color) => (
                  <div
                    key={color.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
                  >
                    <div
                      className="h-8 w-8 shrink-0 rounded-lg border border-white/10"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {color.name}
                      </p>
                      <p className="text-xs text-(--text-faint)">
                        {color.hex} &middot; {color.spoolCount} spool
                        {color.spoolCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-(--color-error) hover:bg-(--color-error-muted)"
                      disabled={color.spoolCount > 0}
                      title={
                        color.spoolCount > 0
                          ? "In use — cannot delete"
                          : "Delete"
                      }
                      onClick={() => handleDeleteColor(color.id, color.name)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "materials" && (
        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-(--text-faint)">
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3 text-right">Spools</th>
                <th className="px-4 py-3 text-right">Total Mass</th>
                <th className="px-4 py-3 text-right">Remaining</th>
                <th className="px-4 py-3 text-right">Usage %</th>
              </tr>
            </thead>
            <tbody>
              {materialStats.map((m) => {
                const mc = MATERIAL_COLORS[m.material];
                const usagePct =
                  m.totalMass > 0
                    ? Math.round(
                        ((m.totalMass - m.currentMass) / m.totalMass) * 100,
                      )
                    : 0;
                return (
                  <tr
                    key={m.material}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Palette
                          className="h-4 w-4"
                          style={{ color: mc?.primary ?? "var(--text-muted)" }}
                        />
                        <span className="font-medium text-foreground">
                          {m.material}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {m.count}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {(m.totalMass / 1000).toFixed(1)}kg
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {(m.currentMass / 1000).toFixed(1)}kg
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-(--bg-surface)">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${usagePct}%`,
                              backgroundColor:
                                mc?.primary ?? "var(--accent-jade)",
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs text-(--text-muted)">
                          {usagePct}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
