"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { addMaterial, removeMaterial } from "@/app/(dashboard)/settings/actions";
import { MATERIAL_COLORS } from "@/lib/constants";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface MaterialManagerProps {
  materials: string[];
}

export function MaterialManager({ materials }: MaterialManagerProps) {
  const [newMaterial, setNewMaterial] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!newMaterial.trim()) return;
    setLoading(true);
    try {
      await addMaterial(newMaterial);
      setNewMaterial("");
      toast.success("Material added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(material: string) {
    try {
      await removeMaterial(material);
      toast.success("Material removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {materials.map((m) => {
          const color = MATERIAL_COLORS[m];
          return (
            <Badge
              key={m}
              variant="outline"
              className="group gap-1.5 border-transparent pr-1 text-xs font-semibold"
              style={{
                backgroundColor: color ? `${color.primary}18` : "var(--bg-card-hover)",
                color: color?.light ?? "var(--text-secondary)",
              }}
            >
              {m}
              <button
                onClick={() => handleRemove(m)}
                className="rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={newMaterial}
          onChange={(e) => setNewMaterial(e.target.value)}
          placeholder="New material name"
          className="max-w-[200px]"
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={loading || !newMaterial.trim()}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>
    </div>
  );
}
