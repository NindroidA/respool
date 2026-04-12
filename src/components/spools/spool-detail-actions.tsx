"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { archiveSpool, unarchiveSpool, deleteSpool } from "@/app/(dashboard)/spools/actions";
import { toast } from "sonner";
import { MoreHorizontal, Archive, ArchiveRestore, Trash2 } from "lucide-react";

interface SpoolDetailActionsProps {
  spoolId: string;
  archived: boolean;
}

export function SpoolDetailActions({ spoolId, archived }: SpoolDetailActionsProps) {
  const router = useRouter();

  async function handleArchiveToggle() {
    try {
      if (archived) {
        await unarchiveSpool(spoolId);
        toast.success("Spool restored");
      } else {
        await archiveSpool(spoolId);
        toast.success("Spool archived");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update spool");
    }
  }

  async function handleDelete() {
    if (!confirm("Permanently delete this spool? This cannot be undone.")) return;
    try {
      await deleteSpool(spoolId);
      toast.success("Spool deleted");
      router.push("/spools");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete spool");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-(--bg-card-hover) hover:text-foreground">
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleArchiveToggle}>
          {archived ? (
            <>
              <ArchiveRestore className="mr-2 h-4 w-4" />
              Restore
            </>
          ) : (
            <>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive-foreground">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
