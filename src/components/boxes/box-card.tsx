"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Package } from "lucide-react";

interface BoxCardProps {
  box: {
    id: string;
    name: string;
    spools: {
      id: string;
      color: string;
      currentMass: number;
    }[];
  };
  index?: number;
}

export function BoxCard({ box, index = 0 }: BoxCardProps) {
  const totalMass = box.spools.reduce((sum, s) => sum + s.currentMass, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
    >
      <Link
        href={`/boxes/${box.id}`}
        className="block rounded-xl border border-border bg-card p-4 transition-colors hover:bg-[var(--bg-card-hover)]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--accent-jade-muted)">
            <Package className="h-4 w-4 text-jade" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{box.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {box.spools.length} spool{box.spools.length !== 1 ? "s" : ""} · {totalMass}g
            </p>
          </div>
        </div>

        {/* Color swatch strip */}
        {box.spools.length > 0 && (
          <div className="mt-3 flex gap-1">
            {box.spools.slice(0, 12).map((spool) => (
              <div
                key={spool.id}
                className="h-3 w-3 shrink-0 rounded-full border border-[var(--border-subtle)]"
                style={{ backgroundColor: spool.color }}
              />
            ))}
            {box.spools.length > 12 && (
              <span className="text-[10px] text-muted-foreground">
                +{box.spools.length - 12}
              </span>
            )}
          </div>
        )}
      </Link>
    </motion.div>
  );
}
