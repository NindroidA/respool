import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Disc, BarChart3, Printer, Server } from "lucide-react";

const features = [
  {
    icon: Disc,
    title: "Spool Tracking",
    description:
      "Track every filament spool with rich metadata — brand, material, color, cost, and real-time remaining weight.",
  },
  {
    icon: BarChart3,
    title: "Usage Analytics",
    description:
      "Dashboard with charts, stats, low filament alerts, and activity feed. Know exactly what you have.",
  },
  {
    icon: Printer,
    title: "Print Logging",
    description:
      "Log prints before or after printing. Dual-mode flow tracks slicer estimates and actual usage.",
  },
  {
    icon: Server,
    title: "Self-Hosted",
    description:
      "Docker deployment with PostgreSQL. Your data stays on your server. No cloud dependency.",
  },
];

export default async function LandingPage() {
  const session = await getSession(await headers());
  if (session?.user) redirect("/dashboard");

  return (
    <div className="noise-overlay relative min-h-screen">
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-20">
        {/* Hero */}
        <div className="text-center">
          {/* Animated gradient border card */}
          <div
            className="mx-auto mb-8 inline-block rounded-2xl p-0.5"
            style={{
              background:
                "conic-gradient(from 0deg, #6ee7b7, #34d399, #10b981, #4ade80, #2dd4bf, #6ee7b7)",
            }}
          >
            <div className="rounded-2xl bg-(--bg-surface) px-8 py-6">
              <Image src="/logo.png" alt="Respool" width={64} height={64} />
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Respool
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-muted-foreground">
            Track every gram. Plan every swap.
            <br />
            <span className="text-sm">
              Self-hosted 3D printing filament management.
            </span>
          </p>

          {/* CTAs */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center rounded-xl bg-linear-to-r from-jade to-neon px-6 py-3 text-sm font-semibold text-(--bg-base) transition-shadow hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              Get Started
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-(--bg-card) hover:text-foreground"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="glass-card p-6 transition-shadow hover:glow-jade"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-(--accent-jade-muted)">
                <feature.icon className="h-5 w-5 text-jade" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-20 text-center">
          <p className="text-xs text-(--text-faint)">
            Open source · MIT License · Built for makers
          </p>
        </div>
      </div>
    </div>
  );
}
