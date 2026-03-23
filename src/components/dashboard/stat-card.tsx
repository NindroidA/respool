"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({ label, value, suffix = "", icon: Icon, color }: StatCardProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const duration = 600;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        setDisplayed(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-(--accent-jade-muted)">
          <Icon className="h-4 w-4 text-jade" />
        </div>
        <div>
          <p
            className="font-mono text-xl font-bold"
            style={{ color: color ?? "var(--text-primary)" }}
          >
            {displayed.toLocaleString()}
            {suffix}
          </p>
          <p className="text-[10px] text-(--text-faint)">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}
