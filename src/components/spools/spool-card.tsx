"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MoreHorizontal, Copy, Archive, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/shared/progress-bar";
import { ColorSwatch } from "@/components/shared/color-swatch";
import { QuickLog } from "@/components/spools/quick-log";
import { MATERIAL_COLORS } from "@/lib/constants";
import {
  duplicateSpool,
  archiveSpool,
  deleteSpool,
} from "@/app/(dashboard)/spools/actions";
import { toast } from "sonner";

interface SpoolCardProps {
  spool: {
    id: string;
    spoolNumber: number;
    name: string;
    brand: string;
    color: string;
    colorSecondary?: string | null;
    material: string;
    currentMass: number;
    startingMass: number;
    archived?: boolean;
    box?: { id: string; name: string } | null;
  };
  index?: number;
}

export function SpoolCard({ spool, index = 0 }: SpoolCardProps) {
  const materialColor = MATERIAL_COLORS[spool.material] ?? {
    primary: "var(--text-muted)",
    light: "var(--text-secondary)",
  };

  async function handleDuplicate() {
    try {
      await duplicateSpool(spool.id);
      toast.success("Spool duplicated");
    } catch {
      toast.error("Failed to duplicate spool");
    }
  }

  async function handleArchive() {
    try {
      await archiveSpool(spool.id);
      toast.success("Spool archived");
    } catch {
      toast.error("Failed to archive spool");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this spool? This cannot be undone.")) return;
    try {
      await deleteSpool(spool.id);
      toast.success("Spool deleted");
    } catch {
      toast.error("Failed to delete spool");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="group"
    >
      <div className="relative rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:bg-(--bg-card-hover) hover:shadow-lg hover:shadow-primary/5">
        {/* Top row: color dot + name + menu */}
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/spools/${spool.id}`}
            className="flex min-w-0 flex-1 items-start gap-3"
          >
            <ColorSwatch
              hex={spool.color}
              hexSecondary={spool.colorSecondary}
              size="md"
              className="mt-0.5"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                <span className="font-mono text-primary">
                  #{spool.spoolNumber}
                </span>{" "}
                {spool.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {spool.brand}
              </p>
            </div>
          </Link>

          {/* Quick log + Actions menu */}
          <div className="flex items-center gap-0.5">
            <QuickLog
              spoolId={spool.id}
              currentMass={spool.currentMass}
              spoolName={spool.name}
            />
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded p-1.5 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive-foreground"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Material badge */}
        <div className="mt-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-transparent text-xs font-semibold"
            style={{
              backgroundColor: `${materialColor.primary}18`,
              color: materialColor.light,
            }}
          >
            {spool.material}
          </Badge>
          {spool.box && (
            <span className="text-[10px] text-muted-foreground">
              {spool.box.name}
            </span>
          )}
        </div>

        {/* Progress bar + mass */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-mono text-xs font-semibold text-neon">
              {spool.currentMass}g
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">
              / {spool.startingMass}g
            </span>
          </div>
          <ProgressBar current={spool.currentMass} total={spool.startingMass} />
        </div>
      </div>
    </motion.div>
  );
}
