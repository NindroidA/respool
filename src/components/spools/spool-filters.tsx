"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { DEFAULT_MATERIALS } from "@/lib/constants";

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
      <Select
        defaultValue={searchParams.get("material") ?? "all"}
        onValueChange={(v) => updateParams("material", v ?? "all")}
      >
        <SelectTrigger className="w-[130px]">
          <SelectValue placeholder="Material" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Materials</SelectItem>
          {materials.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        defaultValue={searchParams.get("sort") ?? "lastUsed"}
        onValueChange={(v) => updateParams("sort", v ?? "lastUsed")}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lastUsed">Last Used</SelectItem>
          <SelectItem value="name">Name</SelectItem>
          <SelectItem value="brand">Brand</SelectItem>
          <SelectItem value="material">Material</SelectItem>
          <SelectItem value="currentMass">Remaining</SelectItem>
          <SelectItem value="createdAt">Date Added</SelectItem>
        </SelectContent>
      </Select>

      {/* Archived toggle */}
      <Select
        defaultValue={searchParams.get("archived") ?? "false"}
        onValueChange={(v) => updateParams("archived", v ?? "false")}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="false">Active</SelectItem>
          <SelectItem value="true">Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
