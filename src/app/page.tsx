import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Footer } from "@/components/layout/footer";
import {
  Disc,
  BarChart3,
  Layers3,
  Calculator,
  QrCode,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";

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
    icon: Layers3,
    title: "Print Logging",
    description:
      "Log prints before or after. Dual-mode flow tracks slicer estimates and actual usage per spool.",
  },
  {
    icon: Calculator,
    title: "Swap Calculator",
    description:
      "Upload G-code, select spools, and get exact layer numbers for spool swaps. Supports 8 slicers.",
  },
  {
    icon: QrCode,
    title: "QR Labels",
    description:
      "Generate customizable QR code labels with 4 templates. Batch download or print directly.",
  },
  {
    icon: ShoppingCart,
    title: "Smart Reorder",
    description:
      "Track purchase links, get low-stock alerts, and see predicted empty dates based on usage patterns.",
  },
];

// Demo data for the interactive preview
const demoSpools = [
  {
    number: 1,
    name: "Generic White",
    brand: "Hatchbox",
    material: "PLA",
    color: "#f5f5f5",
    current: 680,
    total: 1000,
    materialColor: "#10b981",
  },
  {
    number: 2,
    name: "Galaxy Black",
    brand: "eSUN",
    material: "PETG",
    color: "#1a1a2e",
    current: 85,
    total: 1000,
    materialColor: "#0ea5e9",
  },
  {
    number: 3,
    name: "Silk Gold",
    brand: "Polymaker",
    material: "PLA",
    color: "#d4af37",
    current: 920,
    total: 1000,
    materialColor: "#10b981",
  },
  {
    number: 4,
    name: "Neon Pink",
    brand: "AnkerMake",
    material: "TPU",
    color: "#ff69b4",
    current: 450,
    total: 500,
    materialColor: "#c026d3",
  },
];

const demoStats = [
  { label: "spools", value: "12", color: "text-primary" },
  { label: "available", value: "8,450g", color: "text-neon" },
  { label: "prints logged", value: "23", color: "text-teal-400" },
  { label: "materials", value: "4", color: "text-amber-400" },
];

export default async function LandingPage() {
  const session = await getSession(await headers());
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="noise-overlay relative flex-1">
        <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:py-24">
          {/* Hero */}
          <div className="text-center">
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
                3D printing filament management.
              </span>
            </p>

            <div className="mt-8 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-jade to-neon px-6 py-3 text-sm font-semibold text-(--bg-base) transition-shadow hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center rounded-xl border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-(--bg-card) hover:text-foreground"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* ─── Interactive Demo Preview ──────────────────── */}
          <div className="mt-20">
            <div className="mb-8 text-center">
              <p className="text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
                Preview
              </p>
              <h2 className="mt-2 text-xl font-bold text-foreground">
                See what Respool looks like inside
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Real interface components — this is what you get when you sign up
              </p>
            </div>

            {/* Dashboard Stats Preview */}
            <div className="rounded-2xl border border-primary/20 bg-linear-to-br from-primary/5 to-transparent p-6 ring-1 ring-primary/5">
              <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
                Dashboard
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {demoStats.map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-border bg-card p-4 text-center ring-1 ring-primary/5"
                  >
                    <p className={`font-mono text-xl font-bold ${stat.color}`}>
                      {stat.value}
                    </p>
                    <p className="text-2xs font-medium uppercase tracking-wider text-(--text-faint)">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Spool Cards Preview */}
            <div className="mt-4 rounded-2xl border border-border bg-card/50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
                  Your Spools
                </p>
                <span className="rounded-full bg-(--accent-jade-muted) px-2.5 py-0.5 text-2xs font-medium text-jade">
                  4 active
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {demoSpools.map((spool) => {
                  const pct = Math.round((spool.current / spool.total) * 100);
                  const isLow = spool.current <= 100;
                  return (
                    <div
                      key={spool.number}
                      className="rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="mt-0.5 h-5 w-5 shrink-0 rounded-full border border-(--border-subtle)"
                          style={{ backgroundColor: spool.color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            <span className="font-mono text-primary">
                              #{spool.number}
                            </span>{" "}
                            {spool.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {spool.brand}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className="rounded-full px-1.5 py-0.5 text-2xs font-semibold"
                          style={{
                            backgroundColor: `${spool.materialColor}18`,
                            color: spool.materialColor,
                          }}
                        >
                          {spool.material}
                        </span>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1.5 flex items-baseline justify-between">
                          <span
                            className={`font-mono text-xs font-semibold ${isLow ? "text-amber-400" : "text-neon"}`}
                          >
                            {spool.current}g
                          </span>
                          <span className="font-mono text-2xs text-muted-foreground">
                            / {spool.total}g
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--border-default)">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: isLow
                                ? "linear-gradient(90deg, var(--color-error), var(--color-warning))"
                                : "linear-gradient(90deg, var(--accent-jade), var(--accent-neon))",
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculator Preview */}
            <div className="mt-4 rounded-2xl border border-teal-500/20 bg-linear-to-br from-teal-500/5 to-transparent p-6 ring-1 ring-teal-500/5">
              <p className="mb-4 text-2xs font-bold uppercase tracking-widest text-(--text-faint)">
                Swap Calculator
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <p className="text-sm font-medium text-foreground">
                    Upload G-code, pick your spools, get exact pause layers
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports EufyMake, Cura, PrusaSlicer, OrcaSlicer, BambuStudio,
                    Simplify3D, IdeaMaker, and KISSlicer
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
                    <p className="font-mono text-lg font-bold text-teal-400">
                      245
                    </p>
                    <p className="text-2xs text-(--text-faint)">layers</p>
                  </div>
                  <div className="text-lg text-muted-foreground">&rarr;</div>
                  <div className="rounded-xl border border-border bg-card px-4 py-3 text-center">
                    <p className="font-mono text-lg font-bold text-primary">
                      2
                    </p>
                    <p className="text-2xs text-(--text-faint)">swaps</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Features Grid ─────────────────────────────── */}
          <div className="mt-20">
            <div className="mb-8 text-center">
              <h2 className="text-xl font-bold text-foreground">
                Everything you need to manage filament
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          </div>

          {/* ─── Final CTA ─────────────────────────────────── */}
          <div className="mt-20 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Ready to track your filament?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Free and open source. Set up in minutes.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-jade to-neon px-8 py-3 text-sm font-semibold text-(--bg-base) transition-shadow hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
