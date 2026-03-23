import { getBoxes, getUnboxedSpools } from "./actions";
import { BoxCard } from "@/components/boxes/box-card";
import { BoxForm } from "@/components/boxes/box-form";
import { SpoolCard } from "@/components/spools/spool-card";
import { Package } from "lucide-react";

export default async function BoxesPage() {
  const [boxes, unboxedSpools] = await Promise.all([
    getBoxes(),
    getUnboxedSpools(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Boxes
          </h1>
          <p className="text-sm text-muted-foreground">
            {boxes.length} box{boxes.length !== 1 ? "es" : ""}
          </p>
        </div>
        <BoxForm />
      </div>

      {/* Boxes grid */}
      {boxes.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box, i) => (
            <BoxCard key={box.id} box={box} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No boxes yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create a box to organize your spools
          </p>
          <div className="mt-4">
            <BoxForm />
          </div>
        </div>
      )}

      {/* Unboxed spools */}
      {unboxedSpools.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Unboxed Spools
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unboxedSpools.map((spool, i) => (
              <SpoolCard key={spool.id} spool={spool} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
