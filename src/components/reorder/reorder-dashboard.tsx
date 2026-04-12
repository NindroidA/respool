"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MATERIAL_COLORS } from "@/lib/constants";
import {
  AlertTriangle,
  ExternalLink,
  ShoppingCart,
  TrendingDown,
  DollarSign,
  Package,
  Copy,
  Trash2,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface LowStockSpool {
  id: string;
  spoolNumber: number;
  name: string;
  brand: string;
  material: string;
  color: string;
  currentMass: number;
  startingMass: number;
  purchaseLink: string | null;
  purchasePrice: number | null;
  cost: number | null;
  preset: { purchaseLink: string | null; estimatedCost: number | null } | null;
}

interface ArchivedSpool {
  id: string;
  spoolNumber: number;
  name: string;
  brand: string;
  material: string;
  color: string;
  startingMass: number;
  purchaseLink: string | null;
  purchasePrice: number | null;
  cost: number | null;
}

interface Suggestion {
  id: string;
  spoolNumber: number;
  name: string;
  brand: string;
  material: string;
  color: string;
  currentMass: number;
  startingMass: number;
  usageRatePerDay: number;
  daysLeft: number;
  predictedEmpty: Date;
  purchaseLink: string | null;
}

interface Analytics {
  totalSpend: number;
  spoolCount: number;
  avgPerSpool: number;
  costByBrand: { brand: string; costPerGram: number; totalSpend: number }[];
  costByMaterial: {
    material: string;
    costPerGram: number;
    totalSpend: number;
  }[];
  monthlySpend: [string, number][];
}

interface ShoppingItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  link: string | null;
}

interface ReorderDashboardProps {
  lowStockSpools: LowStockSpool[];
  threshold: number;
  archivedSpools: ArchivedSpool[];
  suggestions: Suggestion[];
  analytics: Analytics;
}

export function ReorderDashboard({
  lowStockSpools,
  threshold,
  archivedSpools,
  suggestions,
  analytics,
}: ReorderDashboardProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("respool-shopping-list") ?? "[]");
    } catch {
      return [];
    }
  });

  function addToList(spool: {
    id: string;
    name: string;
    brand: string;
    purchaseLink?: string | null;
    purchasePrice?: number | null;
    cost?: number | null;
    preset?: { purchaseLink?: string | null; estimatedCost?: number | null } | null;
  }) {
    if (shoppingList.some((i) => i.id === spool.id)) {
      toast("Already in shopping list");
      return;
    }
    const item: ShoppingItem = {
      id: spool.id,
      name: spool.name,
      brand: spool.brand,
      price: spool.purchasePrice ?? spool.cost ?? spool.preset?.estimatedCost ?? 0,
      link: spool.purchaseLink ?? spool.preset?.purchaseLink ?? null,
    };
    const updated = [...shoppingList, item];
    setShoppingList(updated);
    localStorage.setItem("respool-shopping-list", JSON.stringify(updated));
    toast.success("Added to shopping list");
  }

  function removeFromList(id: string) {
    const updated = shoppingList.filter((i) => i.id !== id);
    setShoppingList(updated);
    localStorage.setItem("respool-shopping-list", JSON.stringify(updated));
  }

  function clearList() {
    setShoppingList([]);
    localStorage.removeItem("respool-shopping-list");
    toast.success("Shopping list cleared");
  }

  function copyList() {
    const text = shoppingList
      .map(
        (i) =>
          `- ${i.brand} ${i.name}${i.price ? ` — $${(i.price / 100).toFixed(2)}` : ""}${i.link ? `\n  ${i.link}` : ""}`,
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  const getReorderLink = (spool: LowStockSpool) =>
    spool.purchaseLink ?? spool.preset?.purchaseLink;
  const getLastPrice = (spool: LowStockSpool) =>
    spool.purchasePrice ?? spool.cost ?? spool.preset?.estimatedCost;

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Total Spend"
          value={`$${(analytics.totalSpend / 100).toFixed(0)}`}
          color="emerald"
        />
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Spools Tracked"
          value={String(analytics.spoolCount)}
          color="blue"
        />
        <StatCard
          icon={<BarChart3 className="h-4 w-4" />}
          label="Avg / Spool"
          value={`$${(analytics.avgPerSpool / 100).toFixed(2)}`}
          color="amber"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Low Stock"
          value={String(lowStockSpools.length)}
          color="red"
        />
      </div>

      {/* Low Stock */}
      {lowStockSpools.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <AlertTriangle className="h-4 w-4 text-(--color-warning)" />
            Low Stock ({lowStockSpools.length} spools below {threshold}g)
          </h2>
          <div className="space-y-2">
            {lowStockSpools.map((spool) => {
              const mc = MATERIAL_COLORS[spool.material];
              const link = getReorderLink(spool);
              const price = getLastPrice(spool);
              return (
                <div
                  key={spool.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <div
                    className="h-8 w-8 shrink-0 rounded-lg border border-white/10"
                    style={{ backgroundColor: spool.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        #{spool.spoolNumber} {spool.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-transparent text-2xs font-semibold"
                        style={{
                          backgroundColor: mc
                            ? `${mc.primary}18`
                            : undefined,
                          color: mc?.light,
                        }}
                      >
                        {spool.material}
                      </Badge>
                    </div>
                    <p className="text-xs text-(--text-muted)">
                      {spool.brand} &middot;{" "}
                      <span className="font-mono font-bold text-(--color-warning)">
                        {spool.currentMass}g
                      </span>{" "}
                      remaining
                      {price
                        ? ` · Last: $${(price / 100).toFixed(2)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" className="gap-1.5">
                          Reorder
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addToList(spool)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Predicted Shortages */}
      {suggestions.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingDown className="h-4 w-4 text-(--color-error)" />
            Predicted Shortages (next 30 days)
          </h2>
          <div className="space-y-2">
            {suggestions.map((spool) => {
              const pct = Math.round(
                (spool.currentMass / spool.startingMass) * 100,
              );
              return (
                <div
                  key={spool.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">
                      #{spool.spoolNumber} {spool.name}
                    </span>
                    <span className="font-mono text-sm text-(--text-muted)">
                      {spool.currentMass}g left
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-(--text-muted)">
                    Usage: ~{spool.usageRatePerDay.toFixed(1)}g/day · Runs out
                    in ~{Math.round(spool.daysLeft)} days
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-(--bg-surface)">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor:
                          pct < 15
                            ? "var(--color-error)"
                            : pct < 30
                              ? "var(--color-warning)"
                              : "var(--accent-jade)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Archived Spools */}
      {archivedSpools.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Package className="h-4 w-4 text-(--text-faint)" />
            Empty / Archived — Need Restock?
          </h2>
          <div className="space-y-2">
            {archivedSpools.map((spool) => (
              <div
                key={spool.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div
                  className="h-6 w-6 shrink-0 rounded border border-white/10"
                  style={{ backgroundColor: spool.color }}
                />
                <div className="min-w-0 flex-1">
                  <span className="text-sm text-foreground">
                    #{spool.spoolNumber} {spool.brand} {spool.name}
                  </span>
                </div>
                {spool.purchaseLink && (
                  <a
                    href={spool.purchaseLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Reorder
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shopping List */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShoppingCart className="h-4 w-4 text-jade" />
            Shopping List ({shoppingList.length} items)
          </h2>
          {shoppingList.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyList}>
                <Copy className="mr-1 h-3 w-3" />
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={clearList}
                className="text-(--color-error)"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
        {shoppingList.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-sm text-(--text-muted)">
            Add items from the low stock list above
          </div>
        ) : (
          <div className="space-y-1">
            {shoppingList.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-medium text-foreground">
                    {item.brand} {item.name}
                  </span>
                  {item.price > 0 && (
                    <span className="ml-2 text-(--text-muted)">
                      ${(item.price / 100).toFixed(2)}
                    </span>
                  )}
                </div>
                {item.link && (
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 text-(--text-muted) hover:text-jade" />
                  </a>
                )}
                <button onClick={() => removeFromList(item.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-(--text-faint) hover:text-(--color-error)" />
                </button>
              </div>
            ))}
            <p className="pt-1 text-right text-xs text-(--text-muted)">
              Total:{" "}
              <span className="font-mono font-medium text-foreground">
                $
                {(
                  shoppingList.reduce((sum, i) => sum + i.price, 0) / 100
                ).toFixed(2)}
              </span>
            </p>
          </div>
        )}
      </section>

      {/* Cost Analytics */}
      {analytics.costByBrand.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <DollarSign className="h-4 w-4 text-jade" />
            Cost Analytics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* By Brand */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
                Cost per Gram by Brand
              </p>
              <div className="space-y-2">
                {analytics.costByBrand.map(({ brand, costPerGram }) => {
                  const maxCpg = Math.max(
                    ...analytics.costByBrand.map((b) => b.costPerGram),
                  );
                  const pct =
                    maxCpg > 0 ? (costPerGram / maxCpg) * 100 : 0;
                  return (
                    <div key={brand}>
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground">{brand}</span>
                        <span className="font-mono text-(--text-muted)">
                          ${costPerGram.toFixed(3)}/g
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-(--bg-surface)">
                        <div
                          className="h-full rounded-full bg-jade"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Material */}
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
                Cost per Gram by Material
              </p>
              <div className="space-y-2">
                {analytics.costByMaterial.map(
                  ({ material, costPerGram }) => {
                    const mc = MATERIAL_COLORS[material];
                    const maxCpg = Math.max(
                      ...analytics.costByMaterial.map((m) => m.costPerGram),
                    );
                    const pct =
                      maxCpg > 0 ? (costPerGram / maxCpg) * 100 : 0;
                    return (
                      <div key={material}>
                        <div className="flex justify-between text-xs">
                          <span className="text-foreground">{material}</span>
                          <span className="font-mono text-(--text-muted)">
                            ${costPerGram.toFixed(3)}/g
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-(--bg-surface)">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor:
                                mc?.primary ?? "var(--accent-jade)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Monthly Spend */}
      {analytics.monthlySpend.length > 0 && (
        <section>
          <h2 className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Monthly Spend Trend
          </h2>
          <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-4">
            {analytics.monthlySpend.map(([month, amount]) => {
              const maxAmount = Math.max(
                ...analytics.monthlySpend.map(([, a]) => a),
              );
              const heightPct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
              return (
                <div
                  key={month}
                  className="flex flex-1 flex-col items-center gap-1"
                >
                  <span className="font-mono text-2xs text-(--text-muted)">
                    ${(amount / 100).toFixed(0)}
                  </span>
                  <div
                    className="w-full rounded-t bg-jade"
                    style={{
                      height: `${Math.max(heightPct, 4)}px`,
                      maxHeight: "80px",
                    }}
                  />
                  <span className="text-2xs text-(--text-faint)">
                    {month.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "blue" | "amber" | "red";
}) {
  const colorMap = {
    emerald: {
      border: "border-emerald-500/20",
      bg: "from-emerald-500/10",
      text: "text-emerald-400",
      ring: "ring-emerald-500/5",
    },
    blue: {
      border: "border-blue-500/20",
      bg: "from-blue-500/10",
      text: "text-blue-400",
      ring: "ring-blue-500/5",
    },
    amber: {
      border: "border-amber-500/20",
      bg: "from-amber-500/10",
      text: "text-amber-400",
      ring: "ring-amber-500/5",
    },
    red: {
      border: "border-red-500/20",
      bg: "from-red-500/10",
      text: "text-red-400",
      ring: "ring-red-500/5",
    },
  };

  const c = colorMap[color];

  return (
    <div
      className={`rounded-xl border ${c.border} bg-linear-to-br ${c.bg} to-transparent p-4 text-center ring-1 ${c.ring}`}
    >
      <div className={`mb-1 flex items-center justify-center ${c.text}`}>
        {icon}
      </div>
      <p className={`font-mono text-lg font-bold ${c.text}`}>{value}</p>
      <p className="text-2xs font-medium uppercase tracking-wider text-(--text-faint)">
        {label}
      </p>
    </div>
  );
}
