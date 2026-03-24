"use client";

import { Badge } from "@/components/ui/badge";
import { MATERIAL_COLORS } from "@/lib/constants";

interface MaterialManagerProps {
  materials: string[];
}

export function MaterialManager({ materials }: MaterialManagerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {materials.map((m) => {
          const color = MATERIAL_COLORS[m];
          return (
            <Badge
              key={m}
              variant="outline"
              className="border-transparent text-xs font-semibold"
              style={{
                backgroundColor: color ? `${color.primary}18` : "var(--bg-card-hover)",
                color: color?.light ?? "var(--text-secondary)",
              }}
            >
              {m}
            </Badge>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        Custom material management coming soon.
      </p>
    </div>
  );
}
