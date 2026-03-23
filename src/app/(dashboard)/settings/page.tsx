import { getSettings } from "./actions";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure your preferences
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
