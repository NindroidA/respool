"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePrint, updatePrintStatus } from "@/app/(dashboard)/prints/actions";
import { toast } from "sonner";
import { MoreHorizontal, Trash2, Play, CheckCircle } from "lucide-react";

interface PrintCardProps {
  print: {
    id: string;
    name: string;
    notes: string | null;
    status: string;
    totalGramsUsed: number;
    printTimeMinutes: number | null;
    createdAt: Date;
    filaments: {
      gramsUsed: number;
      spool: {
        id: string;
        name: string;
        color: string;
        material: string;
      };
    }[];
  };
  index?: number;
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString();
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  planned: { bg: "rgba(96,165,250,0.12)", text: "#60a5fa", label: "Planned" },
  in_progress: { bg: "rgba(251,191,36,0.12)", text: "#fbbf24", label: "In Progress" },
  completed: { bg: "rgba(16,185,129,0.12)", text: "#6ee7b7", label: "Completed" },
};

export function PrintCard({ print, index = 0 }: PrintCardProps) {
  const statusStyle = STATUS_STYLES[print.status] ?? STATUS_STYLES.completed;

  async function handleDelete() {
    if (!confirm("Delete this print? Filament will be restored to spools.")) return;
    try {
      await deletePrint(print.id);
      toast.success("Print deleted");
    } catch {
      toast.error("Failed to delete print");
    }
  }

  async function handleStatusChange(status: string) {
    try {
      await updatePrintStatus(print.id, status);
      toast.success(`Marked as ${status.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <div className="group flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-(--bg-card-hover)">
        <div className="min-w-0 flex-1">
          {/* Name + status */}
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">
              {print.name}
            </p>
            <Badge
              variant="outline"
              className="shrink-0 border-transparent text-2xs font-semibold"
              style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
              }}
            >
              {statusStyle.label}
            </Badge>
          </div>

          {/* Spool dots + stats */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex gap-1">
              {print.filaments.map((f) => (
                <div
                  key={f.spool.id}
                  className="h-3.5 w-3.5 rounded-full border border-(--border-subtle)"
                  style={{ backgroundColor: f.spool.color }}
                  title={`${f.spool.name}: ${f.gramsUsed}g`}
                />
              ))}
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              {print.totalGramsUsed}g
            </span>
            {print.printTimeMinutes && (
              <span className="font-mono text-xs text-muted-foreground">
                {formatTime(print.printTimeMinutes)}
              </span>
            )}
            <span className="font-mono text-2xs text-(--text-faint)">
              {formatDate(print.createdAt)}
            </span>
          </div>

          {print.notes && (
            <p className="mt-1.5 truncate text-xs text-muted-foreground">
              {print.notes}
            </p>
          )}
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-(--bg-card-hover)">
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {print.status === "planned" && (
              <DropdownMenuItem onClick={() => handleStatusChange("in_progress")}>
                <Play className="mr-2 h-4 w-4" />
                Start Printing
              </DropdownMenuItem>
            )}
            {print.status !== "completed" && (
              <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive-foreground">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
