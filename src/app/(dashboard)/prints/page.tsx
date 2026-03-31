import Link from "next/link";
import { getPrints, getPrintStats } from "./actions";
import { PrintCard } from "@/components/prints/print-card";
import { Button } from "@/components/ui/button";
import { Printer, Plus } from "lucide-react";

interface Props {
  searchParams: Promise<{
    search?: string;
    status?: string;
  }>;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default async function PrintsPage({ searchParams }: Props) {
  const params = await searchParams;

  const [prints, stats] = await Promise.all([
    getPrints({
      search: params.search,
      status: params.status,
    }),
    getPrintStats(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Prints
          </h1>
          <p className="text-sm text-muted-foreground">
            {stats.totalPrints} print{stats.totalPrints !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/prints/new">
          <Button className="gap-2 bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500">
            <Plus className="h-4 w-4" />
            Log a Print
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-primary/20 bg-linear-to-br from-primary/10 to-transparent p-4 text-center ring-1 ring-primary/5">
          <p className="font-mono text-xl font-bold text-primary">
            {stats.totalPrints}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-(--text-faint)">
            total prints
          </p>
        </div>
        <div className="rounded-xl border border-teal-500/20 bg-linear-to-br from-teal-500/10 to-transparent p-4 text-center ring-1 ring-teal-500/5">
          <p className="font-mono text-xl font-bold text-teal-400">
            {stats.totalGrams}g
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-(--text-faint)">
            filament used
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-linear-to-br from-amber-500/10 to-transparent p-4 text-center ring-1 ring-amber-500/5">
          <p className="font-mono text-xl font-bold text-amber-400">
            {stats.totalMinutes > 0 ? formatTime(stats.totalMinutes) : "—"}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wider text-(--text-faint)">
            print time
          </p>
        </div>
      </div>

      {/* Print list */}
      {prints.length > 0 ? (
        <div className="space-y-2">
          {prints.map((print, i) => (
            <PrintCard key={print.id} print={print} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-linear-to-b from-primary/5 to-transparent px-6 py-16 text-center">
          <div className="rounded-xl bg-primary/10 p-3">
            <Printer className="h-8 w-8 text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            No prints yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Log your first print to start tracking
          </p>
          <Link href="/prints/new" className="mt-4">
            <Button className="gap-2 bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500">
              <Plus className="h-4 w-4" />
              Log a Print
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
