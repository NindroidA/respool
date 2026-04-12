"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  Server,
  Palette,
  ShieldAlert,
} from "lucide-react";

const adminNavItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Audit Log", href: "/admin/audit", icon: FileText },
  { label: "System", href: "/admin/system", icon: Server },
  { label: "Content", href: "/admin/content", icon: Palette },
  { label: "Security", href: "/admin/security", icon: ShieldAlert },
];

export function AdminSubNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-(--bg-surface) p-1">
      {adminNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            isActive(item.href)
              ? "bg-(--accent-jade-muted) text-jade"
              : "text-(--text-muted) hover:bg-(--bg-card-hover) hover:text-foreground",
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
