import {
  getLowStockSpools,
  getArchivedForRestock,
  getReorderSuggestions,
  getCostAnalytics,
} from "./actions";
import { ReorderDashboard } from "@/components/reorder/reorder-dashboard";

export default async function ReorderPage() {
  const [lowStock, archived, suggestions, analytics] = await Promise.all([
    getLowStockSpools(),
    getArchivedForRestock(),
    getReorderSuggestions(),
    getCostAnalytics(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Reorder Center
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track low stock, reorder filament, and monitor your spending.
        </p>
      </div>

      <ReorderDashboard
        lowStockSpools={lowStock.spools}
        threshold={lowStock.threshold}
        archivedSpools={archived}
        suggestions={suggestions}
        analytics={analytics}
      />
    </div>
  );
}
