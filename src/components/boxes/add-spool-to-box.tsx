"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { moveSpoolToBox } from "@/app/(dashboard)/boxes/actions";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface SpoolSummary {
  id: string;
  name: string;
  color: string;
  material: string;
}

interface AddSpoolToBoxProps {
  boxId: string;
  unboxedSpools: SpoolSummary[];
}

export function AddSpoolToBox({ boxId, unboxedSpools }: AddSpoolToBoxProps) {
  async function handleAdd(spoolId: string) {
    try {
      await moveSpoolToBox(spoolId, boxId);
      toast.success("Spool added to box");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add spool");
    }
  }

  if (unboxedSpools.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-(--bg-card-hover) hover:text-foreground">
        <Plus className="h-3.5 w-3.5" />
        Add Spool
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
        {unboxedSpools.map((spool) => (
          <DropdownMenuItem key={spool.id} onClick={() => handleAdd(spool.id)}>
            <div
              className="mr-2 h-3 w-3 shrink-0 rounded-full border border-(--border-subtle)"
              style={{ backgroundColor: spool.color }}
            />
            <span className="truncate">{spool.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {spool.material}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
