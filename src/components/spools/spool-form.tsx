"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ColorPicker } from "./color-picker";
import { createSpool, updateSpool } from "@/app/(dashboard)/spools/actions";
import { createSpoolSchema } from "@/lib/validators";
import {
  DEFAULT_MATERIALS,
  DEFAULT_SPOOL_MASS,
  DEFAULT_FILAMENT_DIAMETER,
} from "@/lib/constants";
import { toast } from "sonner";
import { StyledSelect } from "@/components/ui/styled-select";
import { Loader2, Plus } from "lucide-react";

interface FilamentColor {
  id: string;
  name: string;
  hex: string;
  hexSecondary: string | null;
  category: string;
}

interface Box {
  id: string;
  name: string;
}

interface SpoolFormProps {
  spool?: {
    id: string;
    name: string;
    brand: string;
    color: string;
    colorSecondary?: string | null;
    material: string;
    currentMass: number;
    startingMass: number;
    diameter: number | null;
    printingTemperature: number | null;
    note: string;
    boxId: string | null;
    filamentColorId: string | null;
  };
  boxes: Box[];
  colors: FilamentColor[];
  materials?: string[];
  trigger?: React.ReactNode;
}

export function SpoolForm({
  spool,
  boxes,
  colors,
  materials = DEFAULT_MATERIALS,
  trigger,
}: SpoolFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState(spool?.color ?? "#808080");
  const [selectedColorSecondary, setSelectedColorSecondary] = useState<
    string | null
  >(spool?.colorSecondary ?? null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    spool?.filamentColorId ?? null,
  );

  const isEdit = !!spool;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});

    const formData = new FormData(e.currentTarget);
    formData.set("color", selectedColor);
    if (selectedColorSecondary)
      formData.set("colorSecondary", selectedColorSecondary);
    if (selectedColorId) formData.set("filamentColorId", selectedColorId);

    const raw = Object.fromEntries(formData);
    const result = createSpoolSchema.safeParse(raw);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateSpool(spool.id, formData);
        toast.success("Spool updated");
      } else {
        await createSpool(formData);
        toast.success("Spool created");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            {trigger ?? (
              <>
                <Plus className="h-4 w-4" />
                Add Spool
              </>
            )}
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Spool" : "Add New Spool"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Brand */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={spool?.name}
                placeholder="Generic White PLA"
              />
              {errors.name && (
                <p className="text-xs text-(--color-error)">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                name="brand"
                defaultValue={spool?.brand}
                placeholder="Hatchbox"
              />
              {errors.brand && (
                <p className="text-xs text-(--color-error)">{errors.brand}</p>
              )}
            </div>
          </div>

          {/* Material */}
          <div className="space-y-1.5">
            <Label htmlFor="material">Material</Label>
            <StyledSelect
              id="material"
              name="material"
              defaultValue={spool?.material ?? materials[0]}
              options={materials.map((m) => ({ value: m, label: m }))}
            />
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <ColorPicker
              value={selectedColor}
              filamentColorId={selectedColorId}
              colors={colors}
              onChange={(hex, id, hexSecondary) => {
                setSelectedColor(hex);
                setSelectedColorSecondary(hexSecondary);
                setSelectedColorId(id);
              }}
            />
          </div>

          {/* Mass */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startingMass">Starting Mass (g)</Label>
              <Input
                id="startingMass"
                name="startingMass"
                type="number"
                defaultValue={spool?.startingMass ?? DEFAULT_SPOOL_MASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currentMass">Current Mass (g)</Label>
              <Input
                id="currentMass"
                name="currentMass"
                type="number"
                defaultValue={spool?.currentMass ?? DEFAULT_SPOOL_MASS}
              />
            </div>
          </div>

          {/* Diameter + Temp */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="diameter">Diameter (mm)</Label>
              <Input
                id="diameter"
                name="diameter"
                type="number"
                step="0.01"
                defaultValue={spool?.diameter ?? DEFAULT_FILAMENT_DIAMETER}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="printingTemperature">Print Temp (°C)</Label>
              <Input
                id="printingTemperature"
                name="printingTemperature"
                type="number"
                defaultValue={spool?.printingTemperature ?? ""}
                placeholder="200"
              />
            </div>
          </div>

          {/* Box */}
          <div className="space-y-1.5">
            <Label htmlFor="boxId">Box</Label>
            <StyledSelect
              id="boxId"
              name="boxId"
              defaultValue={spool?.boxId ?? ""}
              placeholder="No box"
              options={[
                { value: "", label: "No box" },
                ...boxes.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              name="note"
              defaultValue={spool?.note}
              placeholder="Any additional info..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Spool"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
