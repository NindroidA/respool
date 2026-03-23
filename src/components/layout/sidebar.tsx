"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNavItems, toolNavItems, adminNavItems } from "./nav-items";
import { UserMenu } from "./user-menu";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role: string;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col border-r border-border bg-[var(--bg-raised)] lg:flex">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl text-jade">⬡</span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Respool
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {/* Main */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Main
          </p>
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "border-l-2 border-neon bg-[var(--accent-jade-muted)] text-neon"
                    : "text-muted-foreground hover:bg-[var(--bg-card-hover)] hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Tools
          </p>
          <div className="space-y-1">
            {toolNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "border-l-2 border-neon bg-[var(--accent-jade-muted)] text-neon"
                    : "text-muted-foreground hover:bg-[var(--bg-card-hover)] hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}

            {/* Admin (conditional) */}
            {user.role === "admin" &&
              adminNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "border-l-2 border-neon bg-[var(--accent-jade-muted)] text-neon"
                      : "text-muted-foreground hover:bg-[var(--bg-card-hover)] hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
          </div>
        </div>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-3">
        {/* Search bar */}
        <button className="mb-3 flex w-full items-center justify-between rounded-lg bg-[var(--bg-card)] px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-[var(--bg-card-hover)]">
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            Search...
          </span>
          <kbd className="rounded bg-[var(--border-default)] px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>

        {/* User menu */}
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
