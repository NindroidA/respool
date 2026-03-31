"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StyledSelect } from "@/components/ui/styled-select";
import { Separator } from "@/components/ui/separator";
import { MaterialManager } from "./material-manager";
import { updateSettings } from "@/app/(dashboard)/settings/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SettingsFormProps {
  settings: {
    materialOptions: string[];
    dateFormat: string;
    timeFormat: string;
    defaultMaterial: string;
    defaultMass: number;
    unitPreference: string;
    lowFilamentThreshold: number;
  };
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setLoading(true);
    try {
      await updateSettings({
        materialOptions: settings.materialOptions,
        dateFormat: formData.get("dateFormat") as string,
        timeFormat: formData.get("timeFormat") as string,
        defaultMaterial: formData.get("defaultMaterial") as string,
        defaultMass: parseInt(formData.get("defaultMass") as string) || 1000,
        unitPreference: formData.get("unitPreference") as string,
        lowFilamentThreshold:
          parseInt(formData.get("lowFilamentThreshold") as string) || 100,
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* General */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">General</h3>
          <p className="text-sm text-muted-foreground">
            Default values for new spools
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="defaultMaterial">Default Material</Label>
            <StyledSelect
              id="defaultMaterial"
              name="defaultMaterial"
              defaultValue={settings.defaultMaterial}
              options={settings.materialOptions.map((m) => ({ value: m, label: m }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="defaultMass">Default Mass (g)</Label>
            <Input
              id="defaultMass"
              name="defaultMass"
              type="number"
              defaultValue={settings.defaultMass}
              className="font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lowFilamentThreshold">
              Low Filament Threshold (g)
            </Label>
            <Input
              id="lowFilamentThreshold"
              name="lowFilamentThreshold"
              type="number"
              defaultValue={settings.lowFilamentThreshold}
              className="font-mono"
            />
            <p className="text-[10px] text-(--text-faint)">
              Spools below this amount trigger warnings
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Display */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Display</h3>
          <p className="text-sm text-muted-foreground">
            Date, time, and unit preferences
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="dateFormat">Date Format</Label>
            <StyledSelect
              id="dateFormat"
              name="dateFormat"
              defaultValue={settings.dateFormat}
              options={[
                { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
                { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
                { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timeFormat">Time Format</Label>
            <StyledSelect
              id="timeFormat"
              name="timeFormat"
              defaultValue={settings.timeFormat}
              options={[
                { value: "12h", label: "12-hour" },
                { value: "24h", label: "24-hour" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unitPreference">Unit Preference</Label>
            <StyledSelect
              id="unitPreference"
              name="unitPreference"
              defaultValue={settings.unitPreference}
              options={[
                { value: "grams", label: "Grams (g)" },
                { value: "oz", label: "Ounces (oz)" },
              ]}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Materials */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">Materials</h3>
          <p className="text-sm text-muted-foreground">
            Manage available filament materials
          </p>
        </div>
        <MaterialManager materials={settings.materialOptions} />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Settings
      </Button>
    </form>
  );
}
