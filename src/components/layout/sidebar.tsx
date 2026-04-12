"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
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
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-55 flex-col border-r border-border bg-(--bg-raised) lg:flex">
      {/* Logo */}
      <div className="px-5 py-5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Respool" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Respool
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
        {/* Main */}
        <div>
          <p className="mb-2 px-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
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
                    ? "border-l-2 border-neon bg-(--accent-jade-muted) text-neon"
                    : "text-muted-foreground hover:bg-(--bg-card-hover) hover:text-foreground",
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
          <p className="mb-2 px-3 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
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
                    ? "border-l-2 border-neon bg-(--accent-jade-muted) text-neon"
                    : "text-muted-foreground hover:bg-(--bg-card-hover) hover:text-foreground",
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
                      ? "border-l-2 border-neon bg-(--accent-jade-muted) text-neon"
                      : "text-muted-foreground hover:bg-(--bg-card-hover) hover:text-foreground",
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
        <UserMenu user={user} />
      </div>
    </aside>
  );
}
