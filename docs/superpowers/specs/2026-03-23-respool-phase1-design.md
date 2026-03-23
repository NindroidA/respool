# Respool Phase 1 — Design Spec

> **Date:** 2026-03-23
> **Status:** Draft
> **Approach:** Server Components + Server Actions (Next.js App Router)

---

## 1. Overview

Respool is a self-hosted 3D printing filament management app — a ground-up rebuild of [filatrack](https://github.com/MrDiamondDog/filatrack) with a new tech stack, overhauled UX, expanded features, and production-grade code quality.

**Phase 1 scope:** Auth, spool CRUD, usage logging, boxes, prints (dual-mode), dashboard, settings, admin panel, filament color database, archiving system, and Docker deployment.

**Deferred:** Spool swap calculator (Phase 2), command palette with `cmdk` (Phase 2), slicer API stub (Phase 2), moisture/age warnings (future roadmap).

**Note:** This spec supersedes `DESIGN_SYSTEM.md` and `ARCHITECTURE.md` for all accent colors, component styles, and routing decisions. The companion docs use a cyan (`#22d3ee`) palette and include Phase 2 routes (calculator, command palette) — during Phase 1, treat this spec as authoritative.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router, TypeScript strict, Turbopack dev) |
| Runtime | React 19 |
| Language | TypeScript 5 (strict mode) |
| Package manager | bun |
| Database | PostgreSQL 17 (Docker) |
| ORM | Prisma (schema-first, typed client, migrations) |
| Auth | Better Auth (Prisma adapter, email/password + GitHub + Google OAuth) |
| 2FA | Better Auth `twoFactor` plugin (TOTP, required for admin users) |
| UI | Tailwind CSS v4, shadcn/ui (New York style), Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Fonts | Geist Sans + Geist Mono |
| Validation | Zod |
| Toasts | Sonner |
| Drawers | vaul |
| Theme | next-themes (dark default) |
| Infra | Docker + docker-compose, nginx reverse proxy, Cloudflare DNS |

---

## 3. Architecture

### Data Flow

```
Server Component (Prisma query) → props → Client Component (interactivity) → Server Action (mutation)
```

- **Pages/layouts** are server components by default. They query Prisma directly.
- **Interactive elements** (forms, modals, drag-and-drop) use `"use client"` and receive data via props.
- **All mutations** go through Server Actions: verify session → validate with Zod → Prisma operation → typed result.
- **G-code parser** (Phase 2) runs entirely client-side via `FileReader`.

### Route Structure

```
src/app/
├── layout.tsx                    # Root: fonts, ThemeProvider, Toaster
├── page.tsx                      # Landing page (marketing / login CTA)
├── globals.css                   # Tailwind, CSS vars, custom utilities
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/                  # Authenticated route group
│   ├── layout.tsx                # Sidebar, auth guard
│   ├── dashboard/page.tsx
│   ├── spools/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── boxes/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── prints/
│   │   ├── page.tsx
│   │   └── new/page.tsx          # Dual-mode print flow
│   ├── settings/page.tsx
│   └── admin/                    # Admin-only route group
│       └── page.tsx              # User management + analytics
└── api/
    ├── auth/[...all]/route.ts    # Better Auth handler
    └── health/route.ts           # Docker health check
```

---

## 4. Database Schema

### Changes from Original Spec

The base schema from `ARCHITECTURE.md` is retained with these additions:

**User model — add `role` field:**
```prisma
model User {
  // ... existing fields ...
  role String @default("user") // "user" | "admin"
}
```

**UserSettings model — add low filament threshold:**
```prisma
model UserSettings {
  // ... existing fields ...
  lowFilamentThreshold Int @default(100) // grams remaining to trigger warnings
}
```

**Print model — add dual-mode support:**
```prisma
model Print {
  // ... existing fields ...
  printTimeMinutes Int?     // nullable for pre-print mode (unknown until print completes)
  status           String   @default("completed") // "planned" | "in_progress" | "completed"
  estimatedGrams   Int?     // slicer estimate (pre-print mode)
  estimatedLayers  Int?     // slicer estimate (pre-print mode)
}
```

**FilamentColor model — new color database:**
```prisma
model FilamentColor {
  id          String @id @default(cuid())
  name        String // e.g. "Silk Gold", "Matte Black", "Dual Red-Gold"
  hex         String // primary hex value, e.g. "#D4AF37"
  hexSecondary String? // for dual-color filaments
  category    String // "solid" | "silk" | "matte" | "dual" | "translucent" | "glow" | "marble"
  sortOrder   Int    @default(0)

  @@unique([name, category])
}
```

**Spool model — link to color database:**
```prisma
model Spool {
  // ... existing fields ...
  color          String   // hex value (kept for flexibility / custom colors)
  filamentColorId String? // optional link to FilamentColor database
  filamentColor   FilamentColor? @relation(fields: [filamentColorId], references: [id], onDelete: SetNull)
}
```

All other models (Session, Account, Verification, Spool, SpoolLog, Box, Print, PrintFilament, UserSettings) remain as defined in `ARCHITECTURE.md`.

---

## 5. Authentication & Admin

### Registration
- Open registration (email/password or OAuth)
- No email verification for MVP
- After registration, redirect to dashboard

### Roles
- `role` field on User: `"user"` (default) or `"admin"`
- Admin role set manually via `bun prisma db seed` (creates/promotes admin user) or direct DB update
- No first-user-is-admin magic — explicit manual promotion

### 2FA (TOTP)
- Better Auth `twoFactor` plugin with TOTP
- Admin users **required** to have 2FA enabled
- Admin panel route checks for active 2FA; redirects to setup if not configured
- Regular users can optionally enable 2FA

### Admin Panel (`/admin`)
- Protected: middleware checks `role === "admin"` AND session with 2FA verified
- **User list table:** name, email, auth provider, role, created date, last active, session count
- **Actions per user:** toggle admin role, disable account, delete account (with confirmation)

### Middleware
- Session cookie check for dashboard routes
- Redirect unauthenticated users to `/login`
- Redirect authenticated users away from auth pages to `/dashboard`
- Admin route protection: role + 2FA check

---

## 6. Design System

### Color Palette — Green Gradient System

**Primary accent: Jade anchor (`#10b981`) with full green spectrum**

| Token | Hex | Usage |
|-------|-----|-------|
| `--accent-jade` | `#10b981` | Focus rings, links, hover states |
| `--accent-neon` | `#4ade80` | Active nav, data values, stat numbers |
| `--accent-emerald` | `#34d399` | Material tag tinted backgrounds |
| `--accent-mint` | `#6ee7b7` | Subtle accents, ambient glow |
| `--accent-teal` | `#2dd4bf` | Secondary accent, variety |
| `--gradient-primary` | `#10b981 → #4ade80` | Primary buttons (135deg) |
| `--gradient-border` | conic-gradient of all 5 | Animated hero card borders |

**Backgrounds (unchanged from DESIGN_SYSTEM.md):**

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#09090b` | Page background |
| `--bg-raised` | `#0a0a0c` | Sidebar, top bar |
| `--bg-surface` | `#111113` | Content area |
| `--bg-card` | `#1c1c1f` | Card backgrounds |
| `--bg-card-hover` | `#222225` | Card hover state |
| `--bg-input` | `#1c1c1f` | Form inputs |

**Borders:**

| Token | Value | Usage |
|-------|-------|-------|
| `--border-default` | `#2e2e33` | Cards, inputs |
| `--border-subtle` | `#222226` | Dividers |
| `--border-focus` | `#10b981` | Focus ring (jade) |

**Semantic colors:**

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success` | `#60a5fa` | Success states (blue — shifted away from green) |
| `--color-warning` | `#fbbf24` | Warning states, low filament |
| `--color-error` | `#f87171` | Error states, empty spools |

**Text:**

| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#f4f4f5` | Headings |
| `--text-secondary` | `#a1a1aa` | Body text |
| `--text-muted` | `#71717a` | Placeholder, disabled |
| `--text-faint` | `#52525b` | Labels, hints, timestamps |

### Material Type Colors (Custom Palette)

| Material | Primary | Light | Rationale |
|----------|---------|-------|-----------|
| PLA/PLA+ | `#10b981` | `#6ee7b7` | App primary — most common material |
| PETG | `#0ea5e9` | `#7dd3fc` | Sapphire blue — clear/translucent feel |
| ABS | `#ea580c` | `#fdba74` | Burnt orange — high-temp, industrial |
| TPU | `#c026d3` | `#f0abfc` | Electric fuchsia — flexible, fun |
| ASA | `#d97706` | `#fde68a` | Golden sun — UV-resistant, outdoor |
| PC | `#64748b` | `#cbd5e1` | Cool steel — strong, industrial |
| HIPS | `#6366f1` | `#a5b4fc` | Soft indigo — support material |
| PVA | `#06b6d4` | `#67e8f9` | Aqua — water-soluble |

All defined as custom CSS variables — not Tailwind defaults.

### Typography

- **Geist Sans** — all UI text
- **Geist Mono** — all data/numeric values (weights, temps, costs, IDs, timestamps)
- Scale per `DESIGN_SYSTEM.md`

### Effects

- Glass-morphism cards: `backdrop-filter: blur(16px)`, tinted border
- Glow effects: jade-tinted `box-shadow` on focused/active elements
- Animated gradient border: conic-gradient rotating through all 5 greens (hero cards only)
- Noise texture overlay: subtle grain at 3% opacity
- Framer Motion: page transitions, staggered lists, card hover scale, number counters

### Layout

- **Desktop (>1024px):** Fixed 220px sidebar with grouped nav (Main / Tools), search bar with `⌘K` hint, user avatar at bottom. Content: `max-w-6xl mx-auto`.
- **Tablet (640-1024px):** Collapsible sidebar — icons only, expands on hover/click.
- **Mobile (<640px):** Slim top bar (logo + search + avatar), bottom tab nav (Home, Spools, Boxes, Prints, More → drawer).

---

## 7. Features

### 7.1 Spool Management

**CRUD with rich metadata:**
- Name, brand, color (hex + optional FilamentColor link), material, starting mass, current mass, diameter, printing temp, cost (cents), note, box assignment

**Spool cards show:**
- Color dot (actual hex), name, brand, material badge (custom material colors), progress bar (jade→neon gradient when healthy, amber→red when low), remaining grams in mono font

**Quick-log action:**
- Directly on spool card — popover/inline input for grams used + optional note. No page navigation.

**Spool detail page (`/spools/[id]`):**
- Full edit form, usage timeline, QR code display, similar colors section, archive/delete actions

**Sort/filter bar:**
- Sort: name, brand, material, remaining mass, last used, date added
- Filter: material, box, archived status, low filament threshold
- Search: across name, brand, material, notes

**Other:**
- Duplicate spool (copy fields, reset mass)
- QR codes: 8-char short ID, links to `/spools/{shortId}`
- Recently used section at top of spools page (quick access to 3-4 most recent)

### 7.2 Filament Color Database

**A curated, extensible color library:**
- Categories: solid, silk, matte, dual-color, translucent, glow-in-the-dark, marble
- Seeded with common colors across all categories
- Each entry: name, primary hex, optional secondary hex (dual-color), category
- When adding a spool: pick from library (searchable, with swatches) OR enter custom hex
- Admin/settings: view and add custom colors to the library
- Extensible — add new colors via seed files or settings UI

### 7.3 Color Matching

- Spool detail page shows "Similar Colors" — other spools with visually close hex values
- Auto-suggest box groupings based on color similarity
- Color distance calculated via simple perceptual difference (e.g., weighted RGB or CIE76)

### 7.4 Archiving System

- **Auto-archive:** When `currentMass` reaches 0, spool moves to archived status automatically
- **Manual archive:** Button on spool card/detail page for low or unused spools
- **Archived section:** Dedicated filtered view, spools are restorable (un-archive)
- **Exclusions:** Archived spools excluded from dashboard stats, but preserved for history and print records
- **Delete:** Separate from archive — permanent deletion with confirmation, cascades to logs

### 7.5 Usage Logging

- Each log: grams used, optional note, auto-recorded previous/new mass + timestamp
- Logging auto-deducts from spool's `currentMass`
- Timeline view per spool showing history
- Edit/delete log entries (recalculates mass)
- Quick-log from spool card (no navigation)

### 7.6 Boxes

- CRUD: name, display order (drag-and-drop reorder)
- Box cards: name, color swatch strip (filament color dots), spool count, total mass
- Click box → see spool cards inside
- Drag-and-drop spools between boxes
- "Unboxed" section for unassigned spools
- Auto-suggest groupings based on color similarity

### 7.7 Print Tracking — Dual Mode

**Pre-print mode ("Planning a print"):**
- Enter: name, slicer estimates (grams, layers, time), select spool(s), assign expected grams per spool
- Status: `planned` → `in_progress` → `completed`
- Creates SpoolLog entries with estimated usage
- Can be updated with actuals later (weigh-in or manual entry)

**Post-print mode ("Just finished"):**
- Enter: name, actual grams per spool (or weigh-in), print time, notes
- Status: `completed` immediately
- Creates Print + SpoolLog entries in one flow

**Both modes:**
- Multi-spool prints: assign grams to each spool separately
- Auto-log filament usage to associated spools
- Print list: searchable, filterable by date, shows name, date, total grams, spool count
- Print detail: spool(s) with color dots, grams breakdown, timeline

### 7.8 Dashboard

**Stats cards (animated counters):**
- Total active spools
- Total filament available (sum of active `currentMass`)
- Total filament used (sum of all logs)
- Average spool utilization %

**Charts (Recharts):**
- Donut: filament by material type (using custom material colors)
- Bar: usage over last 30 days (weekly buckets)
- Progress bars: lowest spools (running low warnings)

**Sections:**
- Recently used spools (quick access)
- Low filament alerts: spools below threshold with amber badge
- Activity feed: recent logs, prints, spool additions (timestamped, newest first)

### 7.9 Settings

- Material picker options (add/remove from dropdown)
- Default material, default mass
- Date format (MM/dd/yyyy, dd/MM/yyyy, yyyy-MM-dd)
- Time format (12h, 24h)
- Unit preference (grams/oz — display only, stored as grams)
- Low filament threshold (grams)
- Filament color database management (view/add custom colors)
- 2FA setup (optional for regular users)

---

## 8. Error Handling

### Client
- Zod schemas with inline error messages on forms
- Server Action errors surfaced via Sonner toasts
- Error boundaries wrapping major page sections with friendly fallback UI
- Skeleton loaders for all async data — never blank screens

### Server
- Server Actions: validate → check auth → catch Prisma errors → return typed result
- Prisma error codes: `P2002` (unique constraint), `P2025` (not found), etc.
- Auth errors: redirect to login on session expiry
- Health endpoint: `GET /api/health` → `{ status: "ok" }`

---

## 9. Infrastructure

### Docker
- **docker-compose:** app + postgres:17-alpine, persistent `pgdata` volume
- **Dockerfile:** Multi-stage — bun for deps/build, node:22-alpine for runtime
- **Startup:** `prisma migrate deploy` then `node server.js`
- **Health checks:** app polls `/api/health`, postgres polls `pg_isready`

### Environment Variables
```
DB_PASSWORD, DATABASE_URL
BETTER_AUTH_SECRET, BETTER_AUTH_URL
GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_APP_URL
```

### Deployment
- Self-hosted on Ubuntu server "Prizmo"
- Behind nginx reverse proxy with Cloudflare DNS
- TLS terminated at nginx

---

## 10. Repository Structure & Organization

### License
MIT — open source.

### File Organization
```
respool/
├── README.md                     # Project overview, screenshots, setup guide, tech stack
├── LICENSE                       # MIT
├── .env.example                  # All env vars with placeholder values + comments
├── .gitignore                    # node_modules, .next, .env, pgdata, .superpowers, etc.
├── docker-compose.yml
├── Dockerfile
├── package.json
├── bun.lock
├── tsconfig.json
├── next.config.ts                # standalone output for Docker
├── postcss.config.mjs
├── tailwind.config.ts            # custom colors, fonts, extend theme
├── components.json               # shadcn/ui config
├── docs/
│   ├── ARCHITECTURE.md           # System overview, auth flow, schema (reference)
│   ├── DESIGN_SYSTEM.md          # Visual design reference (reference)
│   ├── FEATURES.md               # Feature spec (reference)
│   └── GCODE_PARSER.md           # Parser spec for Phase 2 (reference)
├── prisma/
│   ├── schema.prisma             # Full database schema
│   ├── migrations/               # Prisma migration history
│   └── seed.ts                   # Seed: FilamentColor database, optional admin user
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root: fonts, ThemeProvider, Toaster
│   │   ├── page.tsx              # Landing page
│   │   ├── globals.css           # Tailwind imports, CSS vars, custom utilities
│   │   ├── (auth)/               # Login, register pages
│   │   ├── (dashboard)/          # Authenticated route group
│   │   │   ├── layout.tsx        # Sidebar, auth guard
│   │   │   ├── dashboard/        # Dashboard page
│   │   │   ├── spools/           # Spool list + detail pages + actions
│   │   │   ├── boxes/            # Box list + detail pages + actions
│   │   │   ├── prints/           # Print list + new print flow + actions
│   │   │   ├── settings/         # User settings page + actions
│   │   │   └── admin/            # Admin panel (user management)
│   │   └── api/
│   │       ├── auth/[...all]/    # Better Auth route handler
│   │       └── health/           # Docker health check
│   ├── components/
│   │   ├── ui/                   # shadcn/ui generated components
│   │   ├── layout/               # Sidebar, Navbar, MobileNav, UserMenu
│   │   ├── spools/               # SpoolCard, SpoolForm, SpoolLog, QuickLog, ColorPicker
│   │   ├── boxes/                # BoxCard, BoxForm, BoxContents
│   │   ├── prints/               # PrintForm, PrintCard, PrintTimeline
│   │   ├── dashboard/            # StatCard, Charts, ActivityFeed, LowFilamentAlert
│   │   ├── admin/                # UserTable, UserActions
│   │   └── shared/               # ColorSwatch, ProgressBar, Skeleton, ConfirmDialog
│   ├── lib/
│   │   ├── auth.ts               # Better Auth server config
│   │   ├── auth-client.ts        # Better Auth client helpers
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── filament-colors.ts    # Color database seed data + color distance utils
│   │   ├── constants.ts          # Material densities, material colors map, defaults
│   │   ├── validators.ts         # Zod schemas for all forms + server actions
│   │   └── utils.ts              # cn() helper, formatters, unit conversion
│   ├── hooks/                    # useSession, useMediaQuery, useDebounce, etc.
│   ├── types/                    # Shared TypeScript types/interfaces
│   └── middleware.ts             # Auth + admin route protection
└── public/
    └── ...                       # Static assets (favicon, OG image, etc.)
```

### README Contents
1. **Hero section** — app name, one-line description, screenshot
2. **Features** — bullet list of key features with icons
3. **Tech stack** — table of technologies
4. **Quick start** — Docker setup (3-4 commands: clone, copy `.env.example`, docker compose up)
5. **Development** — local dev setup (bun install, DB setup, prisma migrate, bun dev)
6. **Environment variables** — table with descriptions
7. **Admin setup** — how to promote a user to admin
8. **License** — MIT

### .gitignore
```
node_modules/
.next/
.env
.env.local
.DS_Store
*.tsbuildinfo
.superpowers/
```

---

## 11. Future Roadmap (Not in Phase 1)

- Spool swap calculator (Phase 2 — G-code parser, swap point calculation, EufyMake integration)
- Command palette with `cmdk` (Phase 2)
- Slicer integration API stub (Phase 2)
- Moisture/age warnings for hygroscopic materials
- Cost intelligence (cost-per-gram, cost-per-print, total spend)
- Weigh-in mode for logging (enter scale weight, app calculates delta)
