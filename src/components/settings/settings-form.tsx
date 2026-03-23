"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
            <select
              id="defaultMaterial"
              name="defaultMaterial"
              defaultValue={settings.defaultMaterial}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {settings.materialOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
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
            <select
              id="dateFormat"
              name="dateFormat"
              defaultValue={settings.dateFormat}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="MM/dd/yyyy">MM/DD/YYYY</option>
              <option value="dd/MM/yyyy">DD/MM/YYYY</option>
              <option value="yyyy-MM-dd">YYYY-MM-DD</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timeFormat">Time Format</Label>
            <select
              id="timeFormat"
              name="timeFormat"
              defaultValue={settings.timeFormat}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unitPreference">Unit Preference</Label>
            <select
              id="unitPreference"
              name="unitPreference"
              defaultValue={settings.unitPreference}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="grams">Grams (g)</option>
              <option value="oz">Ounces (oz)</option>
            </select>
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
