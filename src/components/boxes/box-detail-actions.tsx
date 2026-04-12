"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBox } from "@/app/(dashboard)/boxes/actions";
import { toast } from "sonner";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface BoxDetailActionsProps {
  boxId: string;
}

export function BoxDetailActions({ boxId }: BoxDetailActionsProps) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this box? Spools will be moved to unboxed.")) return;
    try {
      await deleteBox(boxId);
      toast.success("Box deleted");
      router.push("/boxes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete box");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-(--bg-card-hover) hover:text-foreground">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleDelete} className="text-destructive-foreground">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Box
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
