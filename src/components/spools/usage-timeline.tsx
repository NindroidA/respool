"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteLog } from "@/app/(dashboard)/spools/actions";
import { toast } from "sonner";
import { Trash2, ArrowDown } from "lucide-react";

interface LogEntry {
  id: string;
  gramsUsed: number;
  note: string | null;
  previousMass: number;
  newMass: number;
  createdAt: Date;
}

interface UsageTimelineProps {
  logs: LogEntry[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export function UsageTimeline({ logs }: UsageTimelineProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(logId: string) {
    if (!confirm("Delete this log entry? The grams will be added back to the spool.")) return;

    setDeleting(logId);
    try {
      await deleteLog(logId);
      toast.success("Log entry deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete log entry");
    } finally {
      setDeleting(null);
    }
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">No usage logged yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div
          key={log.id}
          className="group flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-(--bg-card-hover)"
        >
          {/* Icon */}
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--color-warning-muted)">
            <ArrowDown className="h-3.5 w-3.5 text-(--color-warning)" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                <span className="font-mono font-semibold text-neon">
                  -{log.gramsUsed}g
                </span>
              </p>
              <span className="shrink-0 font-mono text-2xs text-(--text-faint)">
                {formatRelativeTime(log.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
              {log.previousMass}g → {log.newMass}g
            </p>
            {log.note && (
              <p className="mt-1 text-xs text-muted-foreground">{log.note}</p>
            )}
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => handleDelete(log.id)}
            disabled={deleting === log.id}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      ))}
    </div>
  );
}
