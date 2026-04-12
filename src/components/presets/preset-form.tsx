"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ColorPicker } from "@/components/spools/color-picker";
import {
  createPreset,
  updatePreset,
} from "@/app/(dashboard)/presets/actions";
import {
  DEFAULT_MATERIALS,
  DEFAULT_SPOOL_MASS,
  DEFAULT_FILAMENT_DIAMETER,
} from "@/lib/constants";
import { StyledSelect } from "@/components/ui/styled-select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FilamentColor {
  id: string;
  name: string;
  hex?: string;
  hexSecondary?: string | null;
  category: string;
}

interface PresetFormProps {
  preset?: {
    id: string;
    name: string;
    brand: string;
    material: string;
    color: string;
    colorSecondary: string | null;
    filamentColorId: string | null;
    startingMass: number;
    diameter: number | null;
    printingTemperature: number | null;
    bedTemperature: number | null;
    purchaseLink: string | null;
    estimatedCost: number | null;
  };
  colors: FilamentColor[];
  children: React.ReactNode;
}

export function PresetForm({ preset, colors, children }: PresetFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(
    preset?.color ?? "#808080",
  );
  const [selectedColorSecondary, setSelectedColorSecondary] = useState<
    string | null
  >(preset?.colorSecondary ?? null);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    preset?.filamentColorId ?? null,
  );

  const isEdit = !!preset;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("color", selectedColor);
    if (selectedColorSecondary)
      formData.set("colorSecondary", selectedColorSecondary);
    if (selectedColorId) formData.set("filamentColorId", selectedColorId);

    setLoading(true);
    try {
      if (isEdit) {
        await updatePreset(preset.id, formData);
        toast.success("Preset updated");
      } else {
        await createPreset(formData);
        toast.success("Preset created");
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
      <DialogTrigger render={<span>{children}</span>} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Preset" : "Create Filament Preset"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              name="name"
              defaultValue={preset?.name}
              placeholder="Hatchbox White PLA 1kg"
            />
          </div>

          {/* Brand + Material */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="preset-brand">Brand</Label>
              <Input
                id="preset-brand"
                name="brand"
                defaultValue={preset?.brand}
                placeholder="Hatchbox"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-material">Material</Label>
              <StyledSelect
                id="preset-material"
                name="material"
                defaultValue={preset?.material ?? DEFAULT_MATERIALS[0]}
                options={DEFAULT_MATERIALS.map((m) => ({
                  value: m,
                  label: m,
                }))}
              />
            </div>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color</Label>
            <ColorPicker
              value={selectedColor}
              filamentColorId={selectedColorId}
              colors={colors as Array<{ id: string; name: string; hex: string; hexSecondary: string | null; category: string }>}
              onChange={(hex, id, hexSecondary) => {
                setSelectedColor(hex);
                setSelectedColorSecondary(hexSecondary);
                setSelectedColorId(id);
              }}
            />
          </div>

          {/* Mass + Diameter */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="preset-mass">Starting Mass (g)</Label>
              <Input
                id="preset-mass"
                name="startingMass"
                type="number"
                defaultValue={preset?.startingMass ?? DEFAULT_SPOOL_MASS}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-diameter">Diameter (mm)</Label>
              <Input
                id="preset-diameter"
                name="diameter"
                type="number"
                step="0.01"
                defaultValue={preset?.diameter ?? DEFAULT_FILAMENT_DIAMETER}
              />
            </div>
          </div>

          {/* Temps */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="preset-printTemp">Print Temp (°C)</Label>
              <Input
                id="preset-printTemp"
                name="printingTemperature"
                type="number"
                defaultValue={preset?.printingTemperature ?? ""}
                placeholder="200"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-bedTemp">Bed Temp (°C)</Label>
              <Input
                id="preset-bedTemp"
                name="bedTemperature"
                type="number"
                defaultValue={preset?.bedTemperature ?? ""}
                placeholder="60"
              />
            </div>
          </div>

          {/* Purchase Link + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="preset-link">Purchase Link</Label>
              <Input
                id="preset-link"
                name="purchaseLink"
                type="url"
                defaultValue={preset?.purchaseLink ?? ""}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="preset-cost">Typical Cost (cents)</Label>
              <Input
                id="preset-cost"
                name="estimatedCost"
                type="number"
                defaultValue={preset?.estimatedCost ?? ""}
                placeholder="2499"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save Changes" : "Create Preset"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
