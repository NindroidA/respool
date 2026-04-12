"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FilamentColor {
  id: string;
  name: string;
  hex: string;
  hexSecondary: string | null;
  category: string;
}

interface ColorPickerProps {
  value: string;
  filamentColorId?: string | null;
  colors: FilamentColor[];
  onChange: (
    hex: string,
    filamentColorId: string | null,
    hexSecondary: string | null,
  ) => void;
}

const CATEGORIES = [
  { value: "solid", label: "Solid" },
  { value: "silk", label: "Silk" },
  { value: "matte", label: "Matte" },
  { value: "dual", label: "Dual" },
  { value: "translucent", label: "Clear" },
  { value: "glow", label: "Glow" },
  { value: "marble", label: "Marble" },
];

export function ColorPicker({
  value,
  filamentColorId,
  colors,
  onChange,
}: ColorPickerProps) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("solid");

  const filteredColors = colors.filter(
    (c) =>
      c.category === tab && c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      {/* Preview */}
      <div className="flex items-center gap-3">
        {(() => {
          const selectedColor = filamentColorId
            ? colors.find((c) => c.id === filamentColorId)
            : null;
          const isDual = selectedColor?.hexSecondary;
          return (
            <div
              className="h-10 w-10 shrink-0 rounded-lg border border-border"
              style={{
                background: isDual
                  ? `linear-gradient(135deg, ${selectedColor.hex} 50%, ${selectedColor.hexSecondary} 50%)`
                  : value || "#808080",
              }}
            />
          );
        })()}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            {filamentColorId
              ? (colors.find((c) => c.id === filamentColorId)?.name ?? "Custom")
              : value
                ? "Custom Color"
                : "No color selected"}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{value}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Search */}
        <Input
          placeholder="Search colors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-2"
        />

        {CATEGORIES.map((cat) => (
          <TabsContent key={cat.value} value={cat.value}>
            <ScrollArea className="h-[180px]">
              <div className="grid grid-cols-6 gap-2 p-1">
                {filteredColors.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() =>
                      onChange(color.hex, color.id, color.hexSecondary)
                    }
                    className={cn(
                      "group relative flex h-10 w-full items-center justify-center rounded-lg border-2 transition-all",
                      filamentColorId === color.id
                        ? "border-jade shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                        : "border-transparent hover:border-(--border-default)",
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {color.hexSecondary && (
                      <div
                        className="absolute inset-0 rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, ${color.hex} 50%, ${color.hexSecondary} 50%)`,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>
              {filteredColors.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No colors found
                </p>
              )}
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      {/* Custom hex input */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Or enter a custom hex
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="#FF5733"
            value={value}
            onChange={(e) => onChange(e.target.value, null, null)}
            className="font-mono"
          />
          <input
            type="color"
            value={value || "#808080"}
            onChange={(e) => onChange(e.target.value, null, null)}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
