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
        <h1 className="bg-linear-to-r from-emerald-400 to-teal-400 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
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
