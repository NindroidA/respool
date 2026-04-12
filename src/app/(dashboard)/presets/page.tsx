import { getPresets } from "./actions";
import { getFilamentColors } from "../spools/actions";
import { PresetManager } from "@/components/presets/preset-manager";

export default async function PresetsPage() {
  const [presets, colors] = await Promise.all([
    getPresets({ source: "all" }),
    getFilamentColors(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          Filament Presets
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Save and reuse filament configurations for quick spool creation.
        </p>
      </div>

      <PresetManager presets={presets} colors={colors} />
    </div>
  );
}
