import { ArrowDown, Plus, Printer } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "log" | "spool" | "print";
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  items: ActivityItem[];
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const ICONS = {
  log: ArrowDown,
  spool: Plus,
  print: Printer,
};

const ICON_COLORS = {
  log: { bg: "rgba(251,191,36,0.12)", text: "var(--color-warning)" },
  spool: { bg: "rgba(16,185,129,0.12)", text: "var(--accent-jade)" },
  print: { bg: "rgba(96,165,250,0.12)", text: "var(--color-success)" },
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No recent activity
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const Icon = ICONS[item.type];
        const colors = ICON_COLORS[item.type];

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-(--bg-card-hover)"
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.bg }}
            >
              <Icon className="h-3.5 w-3.5" style={{ color: colors.text }} />
            </div>
            <p className="min-w-0 flex-1 truncate text-sm text-foreground">
              {item.description}
            </p>
            <span className="shrink-0 font-mono text-2xs text-(--text-faint)">
              {formatRelativeTime(item.timestamp)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
