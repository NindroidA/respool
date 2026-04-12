"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, MoreHorizontal, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { mainNavItems, toolNavItems, adminNavItems } from "./nav-items";
import { signOut } from "@/lib/auth-client";

interface MobileNavProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role: string;
  };
}

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const bottomTabs = mainNavItems.slice(0, 4);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-(--bg-raised) px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Respool" width={24} height={24} />
          <span className="text-base font-semibold text-foreground">
            Respool
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-muted-foreground">
            <Search className="h-5 w-5" />
          </button>
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.image ?? undefined} alt={user.name} />
            <AvatarFallback className="bg-(--accent-jade-muted) text-2xs text-jade">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      {/* Bottom tab nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-(--bg-raised) lg:hidden">
        {bottomTabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1",
              isActive(item.href) ? "text-jade" : "text-muted-foreground",
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-2xs font-medium">{item.label}</span>
          </Link>
        ))}

        {/* More drawer */}
        <Sheet>
          <SheetTrigger className="flex flex-col items-center gap-1 px-3 py-1 text-muted-foreground">
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-2xs font-medium">More</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-(--bg-raised)">
            <SheetHeader>
              <SheetTitle className="text-left text-foreground">
                More
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-1">
              {toolNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-(--accent-jade-muted) text-neon"
                      : "text-muted-foreground hover:bg-(--bg-card-hover)",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
              {user.role === "admin" && (
                <>
                  <Separator className="my-2" />
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-(--accent-jade-muted) text-neon"
                          : "text-muted-foreground hover:bg-(--bg-card-hover)",
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
              <Separator className="my-2" />
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-(--bg-card-hover)"
              >
                <LogOut className="h-5 w-5" />
                Sign out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}
