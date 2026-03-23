"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { logUsage } from "@/app/(dashboard)/spools/actions";
import { toast } from "sonner";
import { Loader2, Minus } from "lucide-react";

interface QuickLogProps {
  spoolId: string;
  currentMass: number;
  spoolName: string;
}

export function QuickLog({ spoolId, currentMass, spoolName }: QuickLogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grams, setGrams] = useState("");
  const [note, setNote] = useState("");

  const gramsNum = parseInt(grams) || 0;
  const newMass = Math.max(0, currentMass - gramsNum);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (gramsNum <= 0) return;

    setLoading(true);
    try {
      await logUsage(spoolId, {
        gramsUsed: gramsNum,
        note: note || undefined,
      });
      toast.success(`Logged ${gramsNum}g from ${spoolName}`);
      setOpen(false);
      setGrams("");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to log usage");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-(--bg-card-hover) hover:text-foreground"
        title="Log usage"
      >
        <Minus className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Log Usage</p>
            <p className="text-xs text-muted-foreground">{spoolName}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quicklog-grams" className="text-xs">
              Grams used
            </Label>
            <Input
              id="quicklog-grams"
              type="number"
              min={1}
              max={currentMass}
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              placeholder="e.g. 25"
              autoFocus
            />
          </div>

          {gramsNum > 0 && (
            <div className="flex justify-between rounded-lg bg-(--bg-surface) px-3 py-2 font-mono text-xs">
              <span className="text-muted-foreground">
                {currentMass}g → {newMass}g
              </span>
              <span className="font-semibold text-neon">-{gramsNum}g</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="quicklog-note" className="text-xs">
              Note (optional)
            </Label>
            <Textarea
              id="quicklog-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was this for?"
              rows={2}
            />
          </div>

          <Button
            type="submit"
            size="sm"
            className="w-full"
            disabled={loading || gramsNum <= 0 || gramsNum > currentMass}
          >
            {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Log {gramsNum > 0 ? `${gramsNum}g` : "usage"}
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
