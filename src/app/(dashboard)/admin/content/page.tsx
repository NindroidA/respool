import { getFilamentColorsAdmin, getMaterialStats } from "./actions";
import { ContentManager } from "@/components/admin/content-manager";

export default async function ContentPage() {
  const [colors, materialStats] = await Promise.all([
    getFilamentColorsAdmin(),
    getMaterialStats(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Content Management
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage filament colors, materials, and global data.
        </p>
      </div>

      <ContentManager
        colors={colors.map((c) => ({
          ...c,
          spoolCount: c._count.spools,
        }))}
        materialStats={materialStats.map((m) => ({
          material: m.material,
          count: m._count,
          totalMass: m._sum.startingMass ?? 0,
          currentMass: m._sum.currentMass ?? 0,
        }))}
      />
    </div>
  );
}
