"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProgressBar } from "@/components/shared/progress-bar";
import { moveSpoolToBox } from "@/app/(dashboard)/boxes/actions";
import { MATERIAL_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { MoreHorizontal, ArrowRightLeft, X } from "lucide-react";

interface SpoolInBox {
  id: string;
  name: string;
  brand: string;
  color: string;
  material: string;
  currentMass: number;
  startingMass: number;
}

interface BoxInfo {
  id: string;
  name: string;
}

interface BoxContentsProps {
  spools: SpoolInBox[];
  currentBoxId: string;
  allBoxes: BoxInfo[];
}

export function BoxContents({ spools, currentBoxId, allBoxes }: BoxContentsProps) {
  const otherBoxes = allBoxes.filter((b) => b.id !== currentBoxId);

  async function handleMove(spoolId: string, targetBoxId: string | null) {
    try {
      await moveSpoolToBox(spoolId, targetBoxId);
      toast.success(targetBoxId ? "Spool moved" : "Spool removed from box");
    } catch {
      toast.error("Failed to move spool");
    }
  }

  if (spools.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">No spools in this box</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {spools.map((spool) => {
        const materialColor = MATERIAL_COLORS[spool.material] ?? {
          primary: "var(--text-muted)",
          light: "var(--text-secondary)",
        };

        return (
          <div
            key={spool.id}
            className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-(--bg-card-hover)"
          >
            <Link
              href={`/spools/${spool.id}`}
              className="flex min-w-0 flex-1 items-start gap-3"
            >
              <div
                className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-(--border-subtle)"
                style={{ backgroundColor: spool.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {spool.name}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-transparent text-2xs font-semibold"
                    style={{
                      backgroundColor: `${materialColor.primary}18`,
                      color: materialColor.light,
                    }}
                  >
                    {spool.material}
                  </Badge>
                  <span className="font-mono text-2xs text-muted-foreground">
                    {spool.currentMass}g
                  </span>
                </div>
                <ProgressBar
                  current={spool.currentMass}
                  total={spool.startingMass}
                  className="mt-2"
                />
              </div>
            </Link>

            {/* Move / Remove actions */}
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-(--bg-card-hover)">
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {otherBoxes.length > 0 && (
                  <>
                    {otherBoxes.map((box) => (
                      <DropdownMenuItem
                        key={box.id}
                        onClick={() => handleMove(spool.id, box.id)}
                      >
                        <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                        Move to {box.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => handleMove(spool.id, null)}>
                  <X className="mr-2 h-3.5 w-3.5" />
                  Remove from box
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}
    </div>
  );
}
