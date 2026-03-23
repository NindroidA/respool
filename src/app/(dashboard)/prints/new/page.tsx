import Link from "next/link";
import { getActiveSpools } from "../actions";
import { PrintForm } from "@/components/prints/print-form";
import { ArrowLeft } from "lucide-react";

export default async function NewPrintPage() {
  const spools = await getActiveSpools();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link
        href="/prints"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to prints
      </Link>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Log a Print
        </h1>
        <p className="text-sm text-muted-foreground">
          Track filament usage before or after printing
        </p>
      </div>

      <div className="glass-card p-6">
        <PrintForm spools={spools} />
      </div>
    </div>
  );
}
