"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SpoolSelector } from "./spool-selector";
import { createPrint } from "@/app/(dashboard)/prints/actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SpoolOption {
  id: string;
  name: string;
  brand: string;
  color: string;
  material: string;
  currentMass: number;
}

interface PrintFormProps {
  spools: SpoolOption[];
}

export function PrintForm({ spools }: PrintFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"pre" | "post">("post");
  const [filaments, setFilaments] = useState<
    { spoolId: string; gramsUsed: number }[]
  >([]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (filaments.length === 0 || filaments.some((f) => f.gramsUsed <= 0)) {
      toast.error("Select at least one spool and enter grams used");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      notes: (formData.get("notes") as string) || undefined,
      status: mode === "pre" ? "planned" : "completed",
      filaments,
      printTimeMinutes: undefined as number | undefined,
      estimatedGrams: undefined as number | undefined,
      estimatedLayers: undefined as number | undefined,
    };

    if (!data.name.trim()) {
      toast.error("Name is required");
      return;
    }

    if (mode === "pre") {
      const estGrams = parseInt(formData.get("estimatedGrams") as string);
      const estLayers = parseInt(formData.get("estimatedLayers") as string);
      if (estGrams > 0) data.estimatedGrams = estGrams;
      if (estLayers > 0) data.estimatedLayers = estLayers;
    } else {
      const hours = parseInt(formData.get("hours") as string) || 0;
      const minutes = parseInt(formData.get("minutes") as string) || 0;
      const totalMinutes = hours * 60 + minutes;
      if (totalMinutes > 0) data.printTimeMinutes = totalMinutes;
    }

    setLoading(true);
    try {
      await createPrint(data);
      toast.success(mode === "pre" ? "Print planned" : "Print logged");
      router.push("/prints");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mode toggle */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as "pre" | "post")}
      >
        <TabsList className="w-full">
          <TabsTrigger value="post" className="flex-1">
            Just Finished
          </TabsTrigger>
          <TabsTrigger value="pre" className="flex-1">
            Planning a Print
          </TabsTrigger>
        </TabsList>

        <div className="mt-1 text-xs text-muted-foreground">
          {mode === "post"
            ? "Log a completed print with actual usage"
            : "Plan ahead — enter slicer estimates before printing"}
        </div>
      </Tabs>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Print Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g. Benchy, Phone Stand v2"
          autoFocus
        />
      </div>

      {/* Spools */}
      <SpoolSelector
        spools={spools}
        value={filaments}
        onChange={setFilaments}
      />

      {/* Mode-specific fields */}
      {mode === "pre" ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="estimatedGrams">Estimated Grams</Label>
            <Input
              id="estimatedGrams"
              name="estimatedGrams"
              type="number"
              placeholder="From slicer"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="estimatedLayers">Estimated Layers</Label>
            <Input
              id="estimatedLayers"
              name="estimatedLayers"
              type="number"
              placeholder="From slicer"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>Print Time</Label>
          <div className="flex items-center gap-2">
            <Input
              name="hours"
              type="number"
              min={0}
              placeholder="0"
              className="w-20 font-mono"
            />
            <span className="text-sm text-muted-foreground">h</span>
            <Input
              name="minutes"
              type="number"
              min={0}
              max={59}
              placeholder="0"
              className="w-20 font-mono"
            />
            <span className="text-sm text-muted-foreground">m</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Any notes about this print..."
          rows={2}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {mode === "pre" ? "Plan Print" : "Log Print"}
      </Button>
    </form>
  );
}
