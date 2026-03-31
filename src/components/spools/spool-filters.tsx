"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { StyledSelect } from "@/components/ui/styled-select";
import { Search } from "lucide-react";
import { DEFAULT_MATERIALS } from "@/lib/constants";

const SORT_OPTIONS = [
  { value: "lastUsed", label: "Last Used" },
  { value: "name", label: "Name" },
  { value: "brand", label: "Brand" },
  { value: "material", label: "Material" },
  { value: "currentMass", label: "Remaining" },
  { value: "createdAt", label: "Date Added" },
];

const ARCHIVED_OPTIONS = [
  { value: "false", label: "Active" },
  { value: "true", label: "Archived" },
];

interface SpoolFiltersProps {
  materials?: string[];
}

export function SpoolFilters({
  materials = DEFAULT_MATERIALS,
}: SpoolFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`/spools?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      const timeout = setTimeout(() => updateParams("search", value), 300);
      return () => clearTimeout(timeout);
    },
    [updateParams],
  );

  const currentSort = searchParams.get("sort") ?? "lastUsed";
  const currentMaterial = searchParams.get("material") ?? "all";
  const currentArchived = searchParams.get("archived") ?? "false";

  const materialOptions = [
    { value: "all", label: "All Materials" },
    ...materials.map((m) => ({ value: m, label: m })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative min-w-50 flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search spools..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Material filter */}
      <StyledSelect
        options={materialOptions}
        value={currentMaterial}
        onChange={(v) => updateParams("material", v)}
        className="w-40"
      />

      {/* Sort */}
      <StyledSelect
        options={SORT_OPTIONS}
        value={currentSort}
        onChange={(v) => updateParams("sort", v)}
        className="w-36"
      />

      {/* Archived toggle */}
      <StyledSelect
        options={ARCHIVED_OPTIONS}
        value={currentArchived}
        onChange={(v) => updateParams("archived", v)}
        className="w-28"
      />
    </div>
  );
}
