"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { StyledSelect } from "@/components/ui/styled-select";
import { LabelRenderer } from "./label-renderer";
import {
  type LabelTemplate,
  type LabelFields,
  type LabelSpool,
  DEFAULT_LABEL_FIELDS,
  TEMPLATE_SIZES,
} from "./label-types";
import { Download, FileImage, Printer, Archive } from "lucide-react";
import { toast } from "sonner";

interface LabelGeneratorProps {
  spools: LabelSpool[];
  baseUrl: string;
}

const FIELD_LABELS: Record<keyof LabelFields, string> = {
  spoolNumber: "Spool Number",
  name: "Name",
  brand: "Brand",
  material: "Material",
  colorSwatch: "Color Swatch",
  colorName: "Color Name",
  startingMass: "Starting Mass",
  currentMass: "Current Mass",
  printTemp: "Print Temperature",
  bedTemp: "Bed Temperature",
  diameter: "Diameter",
  box: "Box",
  cost: "Cost",
};

export function LabelGenerator({ spools, baseUrl }: LabelGeneratorProps) {
  const [template, setTemplate] = useState<LabelTemplate>("compact");
  const [fields, setFields] = useState<LabelFields>(DEFAULT_LABEL_FIELDS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(spools.slice(0, 1).map((s) => s.id)),
  );
  const previewRef = useRef<HTMLDivElement>(null);

  const selectedSpools = spools.filter((s) => selectedIds.has(s.id));
  const size = TEMPLATE_SIZES[template];

  const toggleField = (key: keyof LabelFields) => {
    setFields((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSpool = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const downloadPng = useCallback(
    async (labelEl: HTMLElement, filename: string) => {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(labelEl, {
        scale: 3,
        backgroundColor: "#ffffff",
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    },
    [],
  );

  const downloadSingle = async () => {
    if (selectedSpools.length === 0) return;
    const labelEl = previewRef.current?.querySelector("[data-label]");
    if (!labelEl) return;
    const spool = selectedSpools[0];
    await downloadPng(
      labelEl as HTMLElement,
      `spool-${spool.spoolNumber}-${spool.name.replace(/\s+/g, "-").toLowerCase()}.png`,
    );
    toast.success("Label downloaded");
  };

  const downloadBatchZip = async () => {
    if (selectedSpools.length === 0) return;
    const labels = previewRef.current?.querySelectorAll("[data-label]");
    if (!labels || labels.length === 0) return;

    const { default: html2canvas } = await import("html2canvas-pro");
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    for (let i = 0; i < labels.length; i++) {
      const canvas = await html2canvas(labels[i] as HTMLElement, {
        scale: 3,
        backgroundColor: "#ffffff",
      });
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png"),
      );
      const spool = selectedSpools[i];
      zip.file(
        `spool-${spool.spoolNumber}-${spool.name.replace(/\s+/g, "-").toLowerCase()}.png`,
        blob,
      );
    }

    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const a = document.createElement("a");
    a.href = url;
    a.download = "respool-labels.zip";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selectedSpools.length} labels downloaded as ZIP`);
  };

  const printLabels = () => {
    window.print();
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Sidebar Controls */}
      <div className="space-y-6">
        {/* Spool Selector */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Select Spools
          </p>
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {spools.map((spool) => (
              <label
                key={spool.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-(--bg-card-hover)"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(spool.id)}
                  onChange={() => toggleSpool(spool.id)}
                  className="accent-jade"
                />
                <div
                  className="h-3 w-3 rounded-full border border-white/10"
                  style={{ backgroundColor: spool.color }}
                />
                <span className="truncate text-foreground">
                  #{spool.spoolNumber} {spool.name}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set(spools.map((s) => s.id)))}
              className="text-xs text-jade hover:underline"
            >
              Select All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-(--text-muted) hover:underline"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Template */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Template
          </p>
          <StyledSelect
            name="template"
            value={template}
            onChange={(val) => setTemplate(val as LabelTemplate)}
            options={[
              {
                value: "compact",
                label: `Compact (${TEMPLATE_SIZES.compact.label})`,
              },
              {
                value: "standard",
                label: `Standard (${TEMPLATE_SIZES.standard.label})`,
              },
              {
                value: "detailed",
                label: `Detailed (${TEMPLATE_SIZES.detailed.label})`,
              },
              {
                value: "minimal",
                label: `Minimal (${TEMPLATE_SIZES.minimal.label})`,
              },
            ]}
          />
          <p className="mt-2 text-xs text-(--text-muted)">
            Size: {size.label} ({size.width} x {size.height}px)
          </p>
        </div>

        {/* Field Toggles */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
            Fields
          </p>
          <div className="space-y-2">
            {(Object.keys(FIELD_LABELS) as (keyof LabelFields)[]).map((key) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2"
              >
                <Label className="text-sm font-normal">
                  {FIELD_LABELS[key]}
                </Label>
                <Switch
                  checked={fields[key]}
                  onCheckedChange={() => toggleField(key)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Download Actions */}
        <div className="space-y-2">
          {selectedSpools.length === 1 && (
            <Button onClick={downloadSingle} className="w-full gap-2">
              <FileImage className="h-4 w-4" />
              Download PNG
            </Button>
          )}
          {selectedSpools.length > 1 && (
            <Button onClick={downloadBatchZip} className="w-full gap-2">
              <Archive className="h-4 w-4" />
              Download All ({selectedSpools.length}) as ZIP
            </Button>
          )}
          {selectedSpools.length > 0 && (
            <Button
              onClick={printLabels}
              variant="outline"
              className="w-full gap-2"
            >
              <Printer className="h-4 w-4" />
              Print Labels
            </Button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
          Live Preview
        </p>
        {selectedSpools.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-(--text-muted)">
            Select at least one spool to preview labels
          </div>
        ) : (
          <div
            ref={previewRef}
            className="flex flex-wrap gap-4 print:gap-2 print:p-0"
          >
            {selectedSpools.map((spool) => (
              <LabelRenderer
                key={spool.id}
                spool={spool}
                template={template}
                fields={fields}
                baseUrl={baseUrl}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
