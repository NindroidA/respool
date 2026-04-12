"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StyledSelect } from "@/components/ui/styled-select";
import { getAuditLogs } from "@/app/(dashboard)/admin/audit/actions";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  action: string;
  category: string;
  severity: string;
  targetType: string | null;
  targetId: string | null;
  targetName: string | null;
  metadata: unknown;
  createdAt: Date;
}

interface AuditLogViewerProps {
  initialData: {
    logs: AuditLog[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

const SEVERITY_STYLES: Record<string, { dot: string; text: string }> = {
  info: { dot: "bg-(--text-faint)", text: "text-(--text-muted)" },
  warning: { dot: "bg-(--color-warning)", text: "text-(--color-warning)" },
  error: { dot: "bg-(--color-error)", text: "text-(--color-error)" },
  critical: {
    dot: "bg-(--color-error) animate-pulse",
    text: "text-(--color-error) font-bold",
  },
};

export function AuditLogViewer({ initialData }: AuditLogViewerProps) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  async function fetchLogs(page = 1) {
    setLoading(true);
    try {
      const result = await getAuditLogs({
        search: search || undefined,
        category,
        severity,
        page,
      });
      setData(result);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-(--text-faint)" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchLogs(1)}
            placeholder="Search actions, users, targets..."
            className="pl-9"
          />
        </div>
        <StyledSelect
          value={category}
          onChange={(val) => setCategory(val)}
          options={[
            { value: "all", label: "All Categories" },
            { value: "auth", label: "Auth" },
            { value: "spool", label: "Spool" },
            { value: "print", label: "Print" },
            { value: "box", label: "Box" },
            { value: "admin", label: "Admin" },
            { value: "system", label: "System" },
          ]}
          className="w-40"
          size="sm"
        />
        <StyledSelect
          value={severity}
          onChange={(val) => setSeverity(val)}
          options={[
            { value: "all", label: "All Severity" },
            { value: "info", label: "Info" },
            { value: "warning", label: "Warning" },
            { value: "error", label: "Error" },
            { value: "critical", label: "Critical" },
          ]}
          className="w-36"
          size="sm"
        />
        <Button size="sm" onClick={() => fetchLogs(1)}>
          Filter
        </Button>
      </div>

      {/* Log List */}
      <div
        className={`rounded-xl border border-border bg-card ${loading ? "opacity-50" : ""}`}
      >
        {data.logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-(--text-muted)">
            No audit logs found
          </div>
        ) : (
          <div className="divide-y divide-border">
            {data.logs.map((log) => {
              const sev = SEVERITY_STYLES[log.severity] ?? SEVERITY_STYLES.info;
              const isExpanded = expanded.has(log.id);
              return (
                <div key={log.id}>
                  <button
                    onClick={() => toggleExpand(log.id)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-(--bg-card-hover)"
                  >
                    <div
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${sev.dot}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {log.userName ?? "System"}
                        </span>
                        <span className="text-sm text-(--text-muted)">
                          {log.action}
                        </span>
                        {log.targetName && (
                          <span className="truncate text-sm text-(--text-muted)">
                            &ldquo;{log.targetName}&rdquo;
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex gap-2 text-xs text-(--text-faint)">
                        <span>{log.category}</span>
                        <span>&middot;</span>
                        <span className={sev.text}>{log.severity}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs text-(--text-faint)">
                        {formatTime(new Date(log.createdAt))}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-3.5 w-3.5 text-(--text-faint)" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5 text-(--text-faint)" />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-border bg-(--bg-surface) px-4 py-3">
                      <div className="grid gap-2 text-xs sm:grid-cols-2">
                        {log.userEmail && (
                          <Detail label="Email" value={log.userEmail} />
                        )}
                        {log.ipAddress && (
                          <Detail label="IP" value={log.ipAddress} />
                        )}
                        {log.targetType && (
                          <Detail
                            label="Target"
                            value={`${log.targetType} ${log.targetId ?? ""}`}
                          />
                        )}
                        {log.userAgent && (
                          <Detail
                            label="User Agent"
                            value={log.userAgent.slice(0, 80)}
                          />
                        )}
                      </div>
                      {log.metadata != null && (
                        <div className="mt-2">
                          <p className="mb-1 text-xs font-medium text-(--text-faint)">
                            Metadata
                          </p>
                          <pre className="overflow-x-auto rounded bg-(--bg-base) p-2 font-mono text-xs text-(--text-muted)">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-(--text-muted)">
        <span>
          Page {data.page} of {data.totalPages} ({data.total} entries)
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={data.page <= 1}
            onClick={() => fetchLogs(data.page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={data.page >= data.totalPages}
            onClick={() => fetchLogs(data.page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-(--text-faint)">{label}: </span>
      <span className="text-(--text-muted)">{value}</span>
    </div>
  );
}

function formatTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}
