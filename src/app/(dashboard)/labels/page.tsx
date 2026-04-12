import { getLabelSpools } from "./actions";
import { LabelGenerator } from "@/components/labels/label-generator";

export default async function LabelsPage() {
  const spools = await getLabelSpools();

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL ??
    "https://respool.nindroidsystems.com";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
          QR Code Labels
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate customizable labels for your spools with QR codes for quick
          scanning.
        </p>
      </div>

      <LabelGenerator spools={spools} baseUrl={baseUrl} />
    </div>
  );
}
