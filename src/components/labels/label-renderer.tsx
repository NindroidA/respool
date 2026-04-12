"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type {
  LabelTemplate,
  LabelFields,
  LabelSpool,
  TEMPLATE_SIZES,
} from "./label-types";

interface LabelRendererProps {
  spool: LabelSpool;
  template: LabelTemplate;
  fields: LabelFields;
  baseUrl: string;
}

export function LabelRenderer({
  spool,
  template,
  fields,
  baseUrl,
}: LabelRendererProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const spoolUrl = `${baseUrl}/s/${spool.shortId}`;

  useEffect(() => {
    QRCode.toDataURL(spoolUrl, {
      width: template === "minimal" ? 48 : template === "compact" ? 64 : 96,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [spoolUrl, template]);

  if (!qrDataUrl) return null;

  if (template === "minimal") return renderMinimal();
  if (template === "compact") return renderCompact();
  if (template === "standard") return renderStandard();
  return renderDetailed();

  function renderMinimal() {
    return (
      <div
        ref={containerRef}
        data-label
        className="flex items-center gap-2 rounded border border-gray-300 bg-white p-2"
        style={{ width: 216, height: 144 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR" className="h-12 w-12" />
        <div className="min-w-0 flex-1 text-black">
          <p className="truncate text-xs font-bold">
            {fields.spoolNumber && `#${spool.spoolNumber} `}
            {fields.material && spool.material}
          </p>
          {fields.currentMass && (
            <p className="text-xs">{spool.currentMass}g</p>
          )}
          <div className="mt-1 flex items-center gap-1">
            {fields.colorSwatch && (
              <div
                className="h-2.5 w-8 rounded-sm"
                style={{ backgroundColor: spool.color }}
              />
            )}
            {fields.printTemp && spool.printingTemperature && (
              <span className="text-2xs text-gray-600">
                {spool.printingTemperature}°C
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderCompact() {
    return (
      <div
        ref={containerRef}
        data-label
        className="flex items-center gap-3 rounded border border-gray-300 bg-white p-3"
        style={{ width: 288, height: 180 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR" className="h-16 w-16" />
        <div className="min-w-0 flex-1 text-black">
          <p className="truncate text-sm font-bold">
            {fields.spoolNumber && `#${spool.spoolNumber} `}
            {fields.name && spool.name}
          </p>
          <p className="truncate text-xs text-gray-600">
            {fields.material && spool.material}
            {fields.brand && ` · ${spool.brand}`}
          </p>
          <p className="text-xs text-gray-600">
            {fields.currentMass && `${spool.currentMass}g`}
            {fields.printTemp &&
              spool.printingTemperature &&
              ` · ${spool.printingTemperature}°C`}
          </p>
          {fields.colorSwatch && (
            <div
              className="mt-2 h-2 w-full rounded-sm"
              style={{ backgroundColor: spool.color }}
            />
          )}
        </div>
      </div>
    );
  }

  function renderStandard() {
    return (
      <div
        ref={containerRef}
        data-label
        className="flex flex-col rounded border border-gray-300 bg-white p-4"
        style={{ width: 432, height: 288 }}
      >
        {/* Header with color stripe */}
        {fields.colorSwatch && (
          <div className="mb-2 flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-sm"
              style={{ backgroundColor: spool.color }}
            />
            <span className="text-sm font-bold text-black">
              {fields.brand && spool.brand}
            </span>
          </div>
        )}

        <p className="mb-3 truncate text-base font-bold text-black">
          {fields.spoolNumber && `#${spool.spoolNumber} `}
          {fields.name && spool.name}{" "}
          {fields.material && (
            <span className="font-normal text-gray-600">{spool.material}</span>
          )}
        </p>

        <div className="flex flex-1 gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR" className="h-24 w-24" />
          <div className="min-w-0 flex-1 space-y-1 text-xs text-gray-700">
            {fields.currentMass && (
              <p>
                <span className="font-semibold text-black">
                  {spool.currentMass}g
                </span>{" "}
                {fields.startingMass && `/ ${spool.startingMass}g`}
              </p>
            )}
            {fields.printTemp && spool.printingTemperature && (
              <p>{spool.printingTemperature}°C nozzle</p>
            )}
            {fields.bedTemp && spool.bedTemperature && (
              <p>{spool.bedTemperature}°C bed</p>
            )}
            {fields.diameter && spool.diameter && (
              <p>{spool.diameter}mm</p>
            )}
            {fields.box && spool.box && <p>{spool.box.name}</p>}
            {fields.cost && spool.cost && (
              <p>${(spool.cost / 100).toFixed(2)}</p>
            )}
          </div>
        </div>

        <p className="mt-auto pt-2 text-center text-2xs text-gray-400">
          {new URL(baseUrl).hostname}
        </p>
      </div>
    );
  }

  function renderDetailed() {
    return (
      <div
        ref={containerRef}
        data-label
        className="flex flex-col rounded border border-gray-300 bg-white p-5"
        style={{ width: 576, height: 432 }}
      >
        {/* Header */}
        <div className="mb-3 flex items-center gap-3 border-b border-gray-200 pb-3">
          {fields.colorSwatch && (
            <div
              className="h-5 w-5 rounded"
              style={{ backgroundColor: spool.color }}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold text-black">
              {fields.brand && `${spool.brand} — `}
              {fields.name && spool.name}{" "}
              {fields.material && spool.material}
            </p>
          </div>
          {fields.spoolNumber && (
            <span className="text-sm font-bold text-gray-500">
              #{spool.spoolNumber}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR" className="h-32 w-32" />
          <div className="min-w-0 flex-1 space-y-2 text-sm text-gray-700">
            {fields.material && (
              <Row label="Material" value={spool.material} />
            )}
            {fields.currentMass && (
              <Row
                label="Mass"
                value={`${spool.currentMass}g${fields.startingMass ? ` / ${spool.startingMass}g` : ""}`}
              />
            )}
            {fields.printTemp && spool.printingTemperature && (
              <Row
                label="Nozzle"
                value={`${spool.printingTemperature}°C`}
              />
            )}
            {fields.bedTemp && spool.bedTemperature && (
              <Row label="Bed" value={`${spool.bedTemperature}°C`} />
            )}
            {fields.diameter && spool.diameter && (
              <Row label="Diameter" value={`${spool.diameter}mm`} />
            )}
            {fields.cost && spool.cost && (
              <Row label="Cost" value={`$${(spool.cost / 100).toFixed(2)}`} />
            )}
            {fields.box && spool.box && (
              <Row label="Box" value={spool.box.name} />
            )}
            {fields.colorName && spool.filamentColor && (
              <Row
                label="Color"
                value={`${spool.filamentColor.name} (${spool.filamentColor.category})`}
              />
            )}
          </div>
        </div>

        <p className="mt-auto pt-3 text-center text-xs text-gray-400">
          {baseUrl}/s/{spool.shortId}
        </p>
      </div>
    );
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex">
      <span className="w-20 shrink-0 text-gray-500">{label}:</span>
      <span className="font-medium text-black">{value}</span>
    </div>
  );
}
