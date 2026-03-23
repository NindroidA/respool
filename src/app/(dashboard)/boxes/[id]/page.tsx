import { notFound } from "next/navigation";
import Link from "next/link";
import { getBox, getBoxes, getUnboxedSpools, deleteBox } from "../actions";
import { BoxForm } from "@/components/boxes/box-form";
import { BoxContents } from "@/components/boxes/box-contents";
import { BoxDetailActions } from "@/components/boxes/box-detail-actions";
import { AddSpoolToBox } from "@/components/boxes/add-spool-to-box";
import { ArrowLeft, Package } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BoxDetailPage({ params }: Props) {
  const { id } = await params;

  let box;
  try {
    box = await getBox(id);
  } catch {
    notFound();
  }

  const [allBoxes, unboxedSpools] = await Promise.all([
    getBoxes(),
    getUnboxedSpools(),
  ]);

  const totalMass = box.spools.reduce((sum, s) => sum + s.currentMass, 0);
  const boxList = allBoxes.map((b) => ({ id: b.id, name: b.name }));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/boxes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to boxes
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-(--accent-jade-muted)">
            <Package className="h-5 w-5 text-jade" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {box.name}
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              {box.spools.length} spool{box.spools.length !== 1 ? "s" : ""} · {totalMass}g
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddSpoolToBox boxId={box.id} unboxedSpools={unboxedSpools} />
          <BoxForm box={{ id: box.id, name: box.name }} trigger={<span className="text-sm">Edit</span>} />
          <BoxDetailActions boxId={box.id} />
        </div>
      </div>

      {/* Contents */}
      <BoxContents
        spools={box.spools}
        currentBoxId={box.id}
        allBoxes={boxList}
      />
    </div>
  );
}
