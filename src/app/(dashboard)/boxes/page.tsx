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
          <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
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
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-linear-to-b from-primary/5 to-transparent px-6 py-16 text-center">
          <div className="rounded-xl bg-primary/10 p-3">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <p className="mt-4 text-sm font-medium text-foreground">
            No boxes yet
          </p>
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
          <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
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
