"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search spools..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Material filter */}
      <select
        value={currentMaterial}
        onChange={(e) => updateParams("material", e.target.value)}
        className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value="all">All Materials</option>
        {materials.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {/* Sort */}
      <select
        value={currentSort}
        onChange={(e) => updateParams("sort", e.target.value)}
        className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Archived toggle */}
      <select
        value={currentArchived}
        onChange={(e) => updateParams("archived", e.target.value)}
        className="h-10 rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        <option value="false">Active</option>
        <option value="true">Archived</option>
      </select>
    </div>
  );
}
