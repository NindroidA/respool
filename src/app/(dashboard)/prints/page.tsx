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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log a Print
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="font-mono text-lg font-bold text-foreground">
            {stats.totalPrints}
          </p>
          <p className="text-[10px] text-(--text-faint)">total prints</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="font-mono text-lg font-bold text-foreground">
            {stats.totalGrams}g
          </p>
          <p className="text-[10px] text-(--text-faint)">filament used</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="font-mono text-lg font-bold text-foreground">
            {stats.totalMinutes > 0 ? formatTime(stats.totalMinutes) : "—"}
          </p>
          <p className="text-[10px] text-(--text-faint)">print time</p>
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
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Printer className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No prints yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Log your first print to start tracking
          </p>
          <Link href="/prints/new" className="mt-4">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log a Print
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
