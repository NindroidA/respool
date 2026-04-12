"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StyledSelect } from "@/components/ui/styled-select";
import { Badge } from "@/components/ui/badge";
import { MATERIAL_COLORS } from "@/lib/constants";
import { Plus, X } from "lucide-react";

interface SpoolOption {
  id: string;
  name: string;
  brand: string;
  color: string;
  material: string;
  currentMass: number;
}

interface SelectedSpool {
  spoolId: string;
  gramsUsed: number;
}

interface SpoolSelectorProps {
  spools: SpoolOption[];
  value: SelectedSpool[];
  onChange: (value: SelectedSpool[]) => void;
}

export function SpoolSelector({ spools, value, onChange }: SpoolSelectorProps) {
  const [addingSpoolId, setAddingSpoolId] = useState<string>("");

  const selectedIds = new Set(value.map((v) => v.spoolId));
  const availableSpools = spools.filter((s) => !selectedIds.has(s.id));

  function handleAdd() {
    if (!addingSpoolId) return;
    onChange([...value, { spoolId: addingSpoolId, gramsUsed: 0 }]);
    setAddingSpoolId("");
  }

  function handleRemove(spoolId: string) {
    onChange(value.filter((v) => v.spoolId !== spoolId));
  }

  function handleGramsChange(spoolId: string, grams: number) {
    onChange(
      value.map((v) =>
        v.spoolId === spoolId ? { ...v, gramsUsed: grams } : v,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <Label>Spools Used</Label>

      {/* Selected spools */}
      {value.map((selected) => {
        const spool = spools.find((s) => s.id === selected.spoolId);
        if (!spool) return null;

        const materialColor = MATERIAL_COLORS[spool.material] ?? {
          primary: "var(--text-muted)",
          light: "var(--text-secondary)",
        };

        return (
          <div
            key={selected.spoolId}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
          >
            <div
              className="h-5 w-5 shrink-0 rounded-full border border-(--border-subtle)"
              style={{ backgroundColor: spool.color }}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {spool.name}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-transparent text-2xs font-semibold"
                  style={{
                    backgroundColor: `${materialColor.primary}18`,
                    color: materialColor.light,
                  }}
                >
                  {spool.material}
                </Badge>
                <span className="font-mono text-2xs text-muted-foreground">
                  {spool.currentMass}g remaining
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={spool.currentMass}
                value={selected.gramsUsed || ""}
                onChange={(e) =>
                  handleGramsChange(
                    selected.spoolId,
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="grams"
                className="w-24 font-mono text-sm"
              />
              <span className="text-xs text-muted-foreground">g</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => handleRemove(selected.spoolId)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}

      {/* Add spool */}
      {availableSpools.length > 0 && (
        <div className="flex gap-2">
          <StyledSelect
            value={addingSpoolId}
            onChange={(v) => setAddingSpoolId(v)}
            placeholder="Select a spool..."
            className="flex-1"
            options={[
              { value: "", label: "Select a spool..." },
              ...availableSpools.map((spool) => ({
                value: spool.id,
                label: `${spool.name} (${spool.currentMass}g)`,
              })),
            ]}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={!addingSpoolId}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}

      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Select at least one spool used in this print
        </p>
      )}
    </div>
  );
}
