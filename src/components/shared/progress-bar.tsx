"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  lowThreshold?: number;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  lowThreshold = 100,
  className,
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  const isLow = current <= lowThreshold;

  return (
    <div
      className={cn(
        "h-1.5 w-full overflow-hidden rounded-full bg-[var(--border-default)]",
        className
      )}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background: isLow
            ? "linear-gradient(90deg, var(--color-error), var(--color-warning))"
            : "linear-gradient(90deg, var(--accent-jade), var(--accent-neon))",
        }}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}
