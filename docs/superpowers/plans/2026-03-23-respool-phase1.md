# Respool Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete Respool Phase 1 MVP — auth, spool management, usage logging, boxes, prints (dual-mode), dashboard, settings, admin panel, filament color database, archiving, and Docker deployment.

**Architecture:** Next.js App Router with Server Components + Server Actions. Prisma ORM for PostgreSQL. Better Auth for authentication with TOTP 2FA. All data fetching in server components, mutations via typed server actions validated with Zod.

**Tech Stack:** Next.js 15, React 19, TypeScript 5 (strict), Prisma, PostgreSQL 17, Better Auth, Tailwind CSS v4, shadcn/ui, Framer Motion, Recharts, Lucide React, Zod, Sonner, vaul, bun

**Spec:** `docs/superpowers/specs/2026-03-23-respool-phase1-design.md`

---

## Task 1: Repo Cleanup & Project Scaffolding

**Files:**
- Move: `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `FEATURES.md`, `GCODE_PARSER.md` → `docs/`
- Move: `spool-swap-calculator.jsx` → `docs/reference/`
- Delete: `PROMPT.md` (content captured in spec)
- Create: `README.md`, `LICENSE`, `.env.example`, `.gitignore`

- [ ] **Step 1: Clean up existing repo files**

Move docs into `docs/` directory and reference files into `docs/reference/`:
```bash
mkdir -p docs/reference
mv ARCHITECTURE.md DESIGN_SYSTEM.md FEATURES.md GCODE_PARSER.md docs/
mv spool-swap-calculator.jsx docs/reference/
rm PROMPT.md
```

- [ ] **Step 2: Initialize Next.js project**

```bash
bunx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --turbopack --import-alias "@/*" --use-bun --yes
```

This will scaffold into the current directory. If it asks about overwriting, accept — the only files that matter are in `docs/`.

- [ ] **Step 3: Set up .gitignore**

Overwrite the generated `.gitignore` to include all needed entries:
```
node_modules/
.next/
.env
.env.local
.DS_Store
*.tsbuildinfo
.superpowers/
```

- [ ] **Step 4: Create LICENSE file**

MIT license with current year and "Respool Contributors".

- [ ] **Step 5: Create .env.example**

```bash
# Database
DB_PASSWORD=changeme
DATABASE_URL="postgresql://respool:changeme@db:5432/respool"

# Better Auth
BETTER_AUTH_SECRET=generate-a-random-string-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000

# OAuth — GitHub
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# OAuth — Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 6: Create initial README.md**

Include: app name, one-line description ("Self-hosted 3D printing filament management"), tech stack table, setup instructions (clone → copy .env.example → docker compose up), dev instructions (bun install → setup DB → bun dev), MIT license badge.

- [ ] **Step 7: Install core dependencies**

```bash
bun add prisma @prisma/client better-auth zod framer-motion recharts lucide-react sonner vaul next-themes class-variance-authority clsx tailwind-merge qrcode @types/qrcode
bun add -d @types/node
```

- [ ] **Step 8: Install Geist fonts**

```bash
bun add geist
```

- [ ] **Step 9: Configure next.config.ts**

Set `output: "standalone"` for Docker deployment. Enable Turbopack for dev.

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with dependencies"
```

---

## Task 2: Design System — CSS Variables, Fonts, Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Set up globals.css with custom CSS variables**

Replace the generated `globals.css` with the full design system. Include all color tokens from the spec:
- Background tokens (`--bg-base` through `--bg-input`)
- Border tokens (`--border-default`, `--border-subtle`, `--border-focus`)
- Green gradient accent system (`--accent-jade`, `--accent-neon`, `--accent-emerald`, `--accent-mint`, `--accent-teal`)
- Semantic colors (`--color-success` blue, `--color-warning` amber, `--color-error` red)
- Text tokens (`--text-primary` through `--text-faint`)
- Material type color tokens (PLA green, PETG blue, ABS orange, TPU fuchsia, ASA gold, PC steel, HIPS indigo, PVA aqua)
- Glass-morphism utility classes (`.glass-card`, `.glow-jade`, `.glow-jade-strong`)
- Noise texture overlay

Import Tailwind v4 directives. Define both `@theme` for Tailwind integration and `:root` CSS custom properties.

- [ ] **Step 2: Configure root layout with Geist fonts**

Update `src/app/layout.tsx`:
- Import `GeistSans` and `GeistMono` from `geist/font/sans` and `geist/font/mono`
- Apply font CSS variables to `<html>` element
- Set `className="dark"` as default
- Add `suppressHydrationWarning` to `<html>`
- Set metadata: title "Respool", description "Self-hosted 3D printing filament management"

```typescript
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata = {
  title: "Respool",
  description: "Self-hosted 3D printing filament management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create utils.ts with cn() helper**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Verify dev server runs**

```bash
bun dev
```

Open http://localhost:3000 — should show the default Next.js page with dark background and Geist fonts.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: design system — CSS variables, Geist fonts, green gradient palette"
```

---

## Task 3: shadcn/ui Initialization & Base Components

**Files:**
- Create: `components.json`
- Create: `src/components/ui/` (multiple generated files)

- [ ] **Step 1: Initialize shadcn/ui**

```bash
bunx shadcn@latest init
```

Select: New York style, zinc base color (we override via CSS vars), CSS variables = yes, `src/components/ui/` path, import alias `@/`.

- [ ] **Step 2: Install core shadcn components**

```bash
bunx shadcn@latest add button input label card badge dialog dropdown-menu separator skeleton tabs tooltip avatar sheet scroll-area select textarea switch popover command table
```

- [ ] **Step 3: Override shadcn theme colors**

Edit `components.json` and the generated CSS to map to our custom tokens. The shadcn components should use our `--bg-card`, `--border-default`, `--accent-jade` etc. via the CSS variable system.

Update the primary/accent/destructive CSS variables in `globals.css` to map shadcn's expected tokens to our design system tokens.

- [ ] **Step 4: Verify a component renders**

Add a test `<Button>` to the landing page and verify it renders with the jade gradient styling.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize shadcn/ui with custom dark theme"
```

---

## Task 4: Prisma Schema & Database Setup

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Write the full Prisma schema**

Create `prisma/schema.prisma` with ALL models from the spec:
- `User` (with `role` field)
- `Session`, `Account`, `Verification` (Better Auth managed)
- `Spool` (with `filamentColorId` optional relation)
- `SpoolLog`
- `Box`
- `Print` (with `status`, `estimatedGrams`, `estimatedLayers`, nullable `printTimeMinutes`)
- `PrintFilament`
- `UserSettings` (with `lowFilamentThreshold`)
- `FilamentColor` (with `name`, `hex`, `hexSecondary`, `category`, `sortOrder`)

Ensure all relations, cascades, defaults, and unique constraints match the spec exactly.

- [ ] **Step 2: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Create constants file**

Create `src/lib/constants.ts` with:
- `MATERIAL_DENSITIES` record (PLA, PETG, ABS, TPU, ASA, PC, HIPS, PVA)
- `MATERIAL_COLORS` record mapping each material to its `{ primary, light }` hex pair from the spec
- `DEFAULT_MATERIALS` array
- `DEFAULT_SPOOL_MASS` = 1000
- `DEFAULT_FILAMENT_DIAMETER` = 1.75

- [ ] **Step 4: Set up local PostgreSQL for development**

Create a dev docker-compose file or use a local Postgres. Set `DATABASE_URL` in `.env`:

```bash
cp .env.example .env
# Edit .env with actual DATABASE_URL for local dev
```

- [ ] **Step 5: Run initial migration**

```bash
bunx prisma migrate dev --name init
```

- [ ] **Step 6: Generate Prisma client**

```bash
bunx prisma generate
```

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts src/lib/constants.ts
git commit -m "feat: Prisma schema with all models, client singleton, constants"
```

---

## Task 5: Filament Color Database Seed

**Files:**
- Create: `src/lib/filament-colors.ts`
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed config)

- [ ] **Step 1: Create filament color seed data**

Create `src/lib/filament-colors.ts` with a comprehensive color library organized by category:
- **Solid** (~20-25 colors): White, Black, Red, Blue, Green, Yellow, Orange, Purple, Pink, Gray, Brown, Navy, Teal, Coral, Maroon, Olive, Ivory, Beige, Charcoal, etc.
- **Silk** (~10 colors): Silk Gold, Silk Silver, Silk Copper, Silk Bronze, Silk Rose Gold, Silk Sapphire, Silk Emerald, Silk Ruby, Silk Rainbow, etc.
- **Matte** (~8 colors): Matte Black, Matte White, Matte Gray, Matte Navy, etc.
- **Dual-color** (~6 colors): Red-Gold, Blue-Green, Purple-Pink, Black-Red, etc.
- **Translucent** (~5 colors): Clear, Translucent Blue, Translucent Green, Translucent Orange, etc.
- **Glow-in-the-dark** (~3 colors): Glow Green, Glow Blue, Glow Aqua
- **Marble** (~3 colors): Marble White/Gray, Marble Black/White, Marble Rainbow

Each entry: `{ name, hex, hexSecondary?, category, sortOrder }`.

Also export a `colorDistance(hex1, hex2)` utility function for color matching (weighted Euclidean RGB distance).

- [ ] **Step 2: Create seed script**

Create `prisma/seed.ts`:
- Import the color data from `src/lib/filament-colors.ts`
- Upsert all `FilamentColor` records
- Log count of seeded colors

```typescript
import { PrismaClient } from "@prisma/client";
import { FILAMENT_COLORS } from "../src/lib/filament-colors";

const prisma = new PrismaClient();

async function main() {
  for (const color of FILAMENT_COLORS) {
    await prisma.filamentColor.upsert({
      where: { name_category: { name: color.name, category: color.category } },
      update: color,
      create: color,
    });
  }
  console.log(`Seeded ${FILAMENT_COLORS.length} filament colors`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Add seed config to package.json**

```json
{
  "prisma": {
    "seed": "bun prisma/seed.ts"
  }
}
```

- [ ] **Step 4: Run seed**

```bash
bunx prisma db seed
```

Verify colors were inserted.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: filament color database with 60+ colors across 7 categories"
```

---

## Task 6: Better Auth Setup

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-client.ts`
- Create: `src/app/api/auth/[...all]/route.ts`
- Create: `src/middleware.ts`
- Create: `src/lib/validators.ts`

- [ ] **Step 1: Create server-side auth config**

Create `src/lib/auth.ts`:
- `betterAuth()` with Prisma adapter
- Email/password enabled
- GitHub + Google social providers (env vars)
- `twoFactor` plugin with TOTP
- Custom `user` schema additions: `role` field

Reference Better Auth docs for exact Prisma adapter config. Use `better-auth/adapters/prisma`.

- [ ] **Step 2: Create client-side auth helpers**

Create `src/lib/auth-client.ts`:
```typescript
import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
  plugins: [twoFactorClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

- [ ] **Step 3: Create auth API route handler**

Create `src/app/api/auth/[...all]/route.ts`:
```typescript
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

- [ ] **Step 4: Create middleware for route protection**

Create `src/middleware.ts`:
- Check for `better-auth.session_token` cookie
- Dashboard routes (`/dashboard`, `/spools`, `/boxes`, `/prints`, `/settings`, `/admin`) → redirect to `/login` if no session
- Auth pages (`/login`, `/register`) → redirect to `/dashboard` if session exists
- `/admin` routes → additional check (handled at page level for role verification)

- [ ] **Step 5: Create Zod validators**

Create `src/lib/validators.ts` with schemas for:
- `loginSchema` (email, password)
- `registerSchema` (name, email, password, confirmPassword)
- `createSpoolSchema` (all spool fields with proper types/constraints)
- `logUsageSchema` (gramsUsed: positive int, note: optional string)
- `createBoxSchema` (name: string)
- `createPrintSchema` (name, status, optional fields for dual-mode)
- `userSettingsSchema` (all settings fields)

- [ ] **Step 6: Create health check endpoint**

Create `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
```

- [ ] **Step 7: Run migration to sync Better Auth tables if needed**

```bash
bunx prisma migrate dev --name auth-sync
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: Better Auth with email/password, OAuth, TOTP 2FA, middleware"
```

---

## Task 7: Auth Pages — Login & Register

**Files:**
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/components/auth/login-form.tsx`
- Create: `src/components/auth/register-form.tsx`
- Create: `src/components/auth/oauth-buttons.tsx`

- [ ] **Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:
- Centered layout with dark background (`--bg-base`)
- App logo/name at top
- Max-width container for the form
- Glass-morphism card wrapping the form content

- [ ] **Step 2: Create OAuth buttons component**

Create `src/components/auth/oauth-buttons.tsx`:
- "Sign in with GitHub" button (GitHub icon from Lucide)
- "Sign in with Google" button (Google icon)
- Both use `authClient.signIn.social()` with the provider
- Secondary button styling with border

- [ ] **Step 3: Create login form**

Create `src/components/auth/login-form.tsx` (`"use client"`):
- Email + password inputs
- Zod validation via `loginSchema`
- Submit calls `authClient.signIn.email()`
- Error display via inline messages
- Success redirects to `/dashboard`
- Divider with "or continue with"
- OAuth buttons below
- Link to register page

- [ ] **Step 4: Create register form**

Create `src/components/auth/register-form.tsx` (`"use client"`):
- Name, email, password, confirm password inputs
- Zod validation via `registerSchema`
- Submit calls `authClient.signUp.email()`
- Error handling + success redirect
- OAuth buttons + link to login

- [ ] **Step 5: Create login page**

Create `src/app/(auth)/login/page.tsx`:
```typescript
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 6: Create register page**

Same pattern with `RegisterForm`.

- [ ] **Step 7: Verify auth flow works**

Start dev server, navigate to `/login`, create an account, verify redirect to `/dashboard` (will be empty page for now).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: login and register pages with email/password and OAuth"
```

---

## Task 8: Dashboard Layout Shell — Sidebar, Mobile Nav, Theme

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/mobile-nav.tsx`
- Create: `src/components/layout/user-menu.tsx`
- Create: `src/components/layout/nav-items.ts`
- Create: `src/hooks/use-media-query.ts`
- Modify: `src/app/layout.tsx` (add ThemeProvider, Toaster)

- [ ] **Step 1: Add ThemeProvider and Toaster to root layout**

Modify `src/app/layout.tsx`:
- Wrap children in `ThemeProvider` from `next-themes` (default "dark", attribute "class")
- Add `<Toaster />` from `sonner` with jade-themed styling

- [ ] **Step 2: Create nav items config**

Create `src/components/layout/nav-items.ts`:
```typescript
import { LayoutDashboard, Circle, Box, Printer, Settings, Shield } from "lucide-react";

export const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Spools", href: "/spools", icon: Circle },
  { label: "Boxes", href: "/boxes", icon: Box },
  { label: "Prints", href: "/prints", icon: Printer },
];

export const toolNavItems = [
  { label: "Settings", href: "/settings", icon: Settings },
];

export const adminNavItems = [
  { label: "Admin", href: "/admin", icon: Shield },
];
```

- [ ] **Step 3: Create user menu component**

Create `src/components/layout/user-menu.tsx` (`"use client"`):
- Avatar (from OAuth or initials) + name
- Dropdown with: profile info, sign out button
- Sign out calls `authClient.signOut()` then redirects to `/login`

- [ ] **Step 4: Create sidebar component**

Create `src/components/layout/sidebar.tsx` (`"use client"`):
- Fixed 220px width on desktop
- App logo "⬡ Respool" at top in jade color
- Grouped nav sections: "Main" and "Tools" with overline labels
- Active item: jade-tinted background with neon text and left accent bar
- Search bar placeholder at bottom with `⌘K` badge
- User menu at very bottom
- Admin nav items shown only if user role is admin
- Collapsible (icons only) on tablet breakpoint

- [ ] **Step 5: Create mobile nav component**

Create `src/components/layout/mobile-nav.tsx` (`"use client"`):
- Slim top bar: logo left, search icon + avatar right
- Bottom tab nav: Home, Spools, Boxes, Prints, More
- "More" opens a `vaul` drawer with: Settings, Admin (if admin)
- Active tab highlighted with jade color

- [ ] **Step 6: Create useMediaQuery hook**

Create `src/hooks/use-media-query.ts`:
```typescript
import { useState, useEffect } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}
```

- [ ] **Step 7: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:
- Server component that fetches session via Better Auth
- If no session, redirect to `/login`
- Pass user data to client layout wrapper
- Render sidebar on desktop/tablet, mobile nav on mobile
- Main content area with `max-w-6xl mx-auto` and consistent padding

- [ ] **Step 8: Create placeholder dashboard page**

Create `src/app/(dashboard)/dashboard/page.tsx`:
- Simple "Welcome to Respool" heading
- Confirms the layout shell works

- [ ] **Step 9: Verify layout on desktop and mobile**

Start dev server, log in, verify sidebar renders on desktop, bottom nav on mobile (use browser dev tools responsive mode).

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: dashboard layout shell — sidebar, mobile nav, theme provider"
```

---

## Task 9: Spool CRUD — Server Actions & List Page

**Files:**
- Create: `src/app/(dashboard)/spools/actions.ts`
- Create: `src/app/(dashboard)/spools/page.tsx`
- Create: `src/components/spools/spool-card.tsx`
- Create: `src/components/spools/spool-form.tsx`
- Create: `src/components/spools/spool-filters.tsx`
- Create: `src/components/spools/color-picker.tsx`
- Create: `src/components/shared/progress-bar.tsx`

- [ ] **Step 1: Create spool server actions**

Create `src/app/(dashboard)/spools/actions.ts` (`"use server"`):
- `getSpools(userId, filters?)` — query with optional material/box/archived/search filters, sort options
- `createSpool(formData)` — validate with Zod, check auth, create via Prisma
- `updateSpool(id, formData)` — validate, check ownership, update
- `deleteSpool(id)` — check ownership, cascade delete
- `duplicateSpool(id)` — copy fields, reset mass to starting
- `archiveSpool(id)` — set `archived: true`
- `unarchiveSpool(id)` — set `archived: false`

Each action: verify session → validate input → Prisma operation → `revalidatePath("/spools")`.

- [ ] **Step 2: Create progress bar component**

Create `src/components/shared/progress-bar.tsx`:
- Takes `current`, `total`, optional `lowThreshold`
- Calculates percentage
- Jade→neon gradient when healthy (>threshold)
- Amber→red gradient when low (<=threshold)
- Smooth width transition via Framer Motion

- [ ] **Step 3: Create spool card component**

Create `src/components/spools/spool-card.tsx` (`"use client"`):
- Color dot (actual spool hex color)
- Name (bold) + brand (muted)
- Material badge with custom material color from `MATERIAL_COLORS`
- Progress bar (current/starting mass)
- Remaining grams in mono font
- Hover: subtle scale (1.015) via Framer Motion
- Click navigates to detail page
- Quick-log button (handled in Task 10)
- Three-dot menu: duplicate, archive, delete

- [ ] **Step 4: Create color picker component**

Create `src/components/spools/color-picker.tsx` (`"use client"`):
- Two modes: "Library" (browse FilamentColor database) and "Custom" (hex input)
- Library mode: grid of color swatches grouped by category tabs (Solid, Silk, Matte, etc.)
- Search/filter within library
- Custom mode: hex input with live color preview
- Returns both the hex value and optional `filamentColorId`

- [ ] **Step 5: Create spool form component**

Create `src/components/spools/spool-form.tsx` (`"use client"`):
- All spool fields: name, brand, color (via ColorPicker), material (select from user's materials), starting mass, current mass, diameter, printing temp, cost, note, box (select)
- Zod validation with inline errors
- Submit calls `createSpool` or `updateSpool` server action
- Success: toast + redirect/close
- Rendered in a Dialog (modal)

- [ ] **Step 6: Create spool filters component**

Create `src/components/spools/spool-filters.tsx` (`"use client"`):
- Sort dropdown: name, brand, material, remaining, last used, date added
- Filter dropdowns: material (multi-select), box, archived toggle
- Search input with debounce
- Updates URL search params for server-side filtering

- [ ] **Step 7: Create spools list page**

Create `src/app/(dashboard)/spools/page.tsx` (server component):
- Read search params for filters/sort
- Fetch spools via Prisma (filtered, sorted)
- Fetch boxes for filter dropdown
- Render: page title + "Add Spool" button, filter bar, recently used section (last 4 by `lastUsed`), spool cards grid (responsive: 1 col mobile, 2 tablet, 3-4 desktop)
- Staggered entry animation via Framer Motion
- Empty state: "No spools yet" with CTA to add first spool

- [ ] **Step 8: Verify spool creation and listing**

Start dev server, navigate to `/spools`, add a spool via the form, verify it appears in the list with correct colors and progress bar.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: spool CRUD — list page, card, form, color picker, filters"
```

---

## Task 10: Spool Detail Page & Usage Logging

**Files:**
- Create: `src/app/(dashboard)/spools/[id]/page.tsx`
- Create: `src/components/spools/spool-detail.tsx`
- Create: `src/components/spools/quick-log.tsx`
- Create: `src/components/spools/usage-timeline.tsx`
- Create: `src/components/spools/similar-colors.tsx`
- Modify: `src/app/(dashboard)/spools/actions.ts` (add log actions)

- [ ] **Step 1: Add usage logging server actions**

Add to `src/app/(dashboard)/spools/actions.ts`:
- `logUsage(spoolId, gramsUsed, note?)` — validate, create SpoolLog, deduct from `currentMass`, update `lastUsed`. If `currentMass` reaches 0, auto-archive.
- `getSpoolLogs(spoolId)` — fetch logs ordered by createdAt desc
- `updateLog(logId, gramsUsed, note?)` — recalculate spool mass
- `deleteLog(logId)` — recalculate spool mass (add grams back)

- [ ] **Step 2: Create quick-log component**

Create `src/components/spools/quick-log.tsx` (`"use client"`):
- Popover triggered from spool card
- Input: grams used (number), optional note (textarea)
- Shows current mass and what new mass will be
- Submit calls `logUsage` action
- Success: toast, popover closes, card updates

- [ ] **Step 3: Create usage timeline component**

Create `src/components/spools/usage-timeline.tsx`:
- Chronological list of SpoolLog entries
- Each entry: grams used, note (if any), previous→new mass, timestamp
- Edit/delete buttons on each entry
- Edit opens inline form, delete has confirmation
- Empty state: "No usage logged yet"

- [ ] **Step 4: Create similar colors component**

Create `src/components/spools/similar-colors.tsx`:
- Takes the current spool's hex color
- Uses `colorDistance()` from `filament-colors.ts` to find other spools with similar colors
- Shows up to 4 similar spools as mini cards (color dot + name + remaining grams)
- Click navigates to that spool's detail page

- [ ] **Step 5: Create spool detail page**

Create `src/app/(dashboard)/spools/[id]/page.tsx` (server component):
- Fetch spool by ID with logs, box, filamentColor
- Verify ownership (userId matches session)
- Render: back link, spool name + material badge, edit button
- Large color swatch + progress bar
- Stats row: remaining grams, total used, times used, cost per gram
- Usage timeline
- Similar colors section
- QR code display (use a simple QR code generator — `qrcode` package or inline SVG)
- Archive/delete buttons at bottom

- [ ] **Step 6: Wire up quick-log to spool cards**

Modify `spool-card.tsx` to include the QuickLog popover button.

- [ ] **Step 7: Verify full spool workflow**

Test: create spool → view detail → log usage → verify mass updates → check auto-archive at 0g → view timeline → edit/delete log entry.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: spool detail page, usage logging, quick-log, color matching"
```

---

## Task 11: Boxes CRUD

**Files:**
- Create: `src/app/(dashboard)/boxes/actions.ts`
- Create: `src/app/(dashboard)/boxes/page.tsx`
- Create: `src/app/(dashboard)/boxes/[id]/page.tsx`
- Create: `src/components/boxes/box-card.tsx`
- Create: `src/components/boxes/box-form.tsx`
- Create: `src/components/boxes/box-contents.tsx`

- [ ] **Step 1: Create box server actions**

Create `src/app/(dashboard)/boxes/actions.ts` (`"use server"`):
- `getBoxes(userId)` — fetch boxes with spool count and total mass aggregation
- `createBox(formData)` — validate, create
- `updateBox(id, formData)` — validate, update
- `deleteBox(id)` — unassign spools from box, then delete
- `reorderBoxes(orderedIds)` — update `displayOrder` for each
- `moveSpoolToBox(spoolId, boxId | null)` — update spool's `boxId`

- [ ] **Step 2: Create box card component**

Create `src/components/boxes/box-card.tsx` (`"use client"`):
- Box name
- Color swatch strip: row of small dots showing filament colors of contained spools
- Spool count + total mass in mono font
- Hover scale animation
- Click navigates to box detail

- [ ] **Step 3: Create box form component**

Simple dialog with name input. Used for create and edit.

- [ ] **Step 4: Create box contents component**

Create `src/components/boxes/box-contents.tsx` (`"use client"`):
- Renders spool cards for spools in this box
- Drag-and-drop reorder within box (use Framer Motion `Reorder`)
- "Move to Box" dropdown action on each spool (select target box or "Remove from box")
- Note: cross-box drag-and-drop is complex — use dropdown-based move for MVP, can upgrade to drag later

- [ ] **Step 5: Create boxes list page**

Create `src/app/(dashboard)/boxes/page.tsx` (server component):
- Fetch all boxes with spool aggregations
- Render: page title + "Add Box" button, box cards grid
- "Unboxed" section at bottom showing spools with no box assignment
- Empty state for no boxes

- [ ] **Step 6: Create box detail page**

Create `src/app/(dashboard)/boxes/[id]/page.tsx`:
- Box name (editable), spool count, total mass
- Box contents with spool cards
- "Add Spool to Box" button (select from unboxed spools)
- Delete box button

- [ ] **Step 7: Verify box workflow**

Test: create box → assign spools → view box detail → remove spool → delete box → verify spools become unboxed.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: boxes CRUD — list, detail, spool assignment, color swatch strip"
```

---

## Task 12: Print Tracking — Dual Mode

**Files:**
- Create: `src/app/(dashboard)/prints/actions.ts`
- Create: `src/app/(dashboard)/prints/page.tsx`
- Create: `src/app/(dashboard)/prints/new/page.tsx`
- Create: `src/components/prints/print-form.tsx`
- Create: `src/components/prints/print-card.tsx`
- Create: `src/components/prints/spool-selector.tsx`

- [ ] **Step 1: Create print server actions**

Create `src/app/(dashboard)/prints/actions.ts` (`"use server"`):
- `createPrint(formData)` — validate, create Print + PrintFilament records, log usage to each spool
- `updatePrint(id, formData)` — update print, recalculate spool usage if grams changed
- `deletePrint(id)` — delete print, reverse spool usage (add grams back)
- `getPrints(userId, filters?)` — fetch with date range filter, search, includes spool info
- `updatePrintStatus(id, status)` — transition planned → in_progress → completed

Pre-print mode: creates Print with `status: "planned"`, SpoolLog entries with estimated usage.
Post-print mode: creates Print with `status: "completed"`, SpoolLog entries with actual usage.

- [ ] **Step 2: Create spool selector component**

Create `src/components/prints/spool-selector.tsx` (`"use client"`):
- Multi-spool selection from user's active (non-archived) spools
- Each selected spool gets a grams input
- Shows spool name, material badge, color dot, remaining grams
- "Add another spool" button
- Removes spool from selection

- [ ] **Step 3: Create print form**

Create `src/components/prints/print-form.tsx` (`"use client"`):
- Mode toggle: "Planning a print" (pre-print) / "Just finished" (post-print)
- Common fields: name, notes
- Pre-print: estimated grams, estimated layers, estimated time, spool selector with estimated grams per spool
- Post-print: actual grams per spool (or total), print time (hours:minutes input)
- Spool selector component
- Submit creates print + logs usage

- [ ] **Step 4: Create print card component**

Create `src/components/prints/print-card.tsx`:
- Print name, date, status badge (planned/in_progress/completed)
- Spool dots (color swatches of spools used)
- Total grams + print time
- Click opens detail in a Sheet/drawer (no separate detail route — keeps it lightweight)

- [ ] **Step 5: Create new print page**

Create `src/app/(dashboard)/prints/new/page.tsx`:
- Server component that fetches user's spools
- Renders PrintForm with spool data

- [ ] **Step 6: Create prints list page**

Create `src/app/(dashboard)/prints/page.tsx` (server component):
- Fetch prints with date filter, search
- "Log a Print" button → navigates to `/prints/new`
- Print cards list (newest first)
- Stats at top: total prints, total grams used, total print time
- Filter by date range
- Empty state

- [ ] **Step 7: Verify dual-mode print flow**

Test pre-print: create planned print → verify spool mass deducted → update status to completed → update with actual grams.
Test post-print: create completed print → verify spool mass deducted → verify SpoolLog entries created.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: print tracking with dual-mode (pre-print planning, post-print logging)"
```

---

## Task 13: Dashboard

**Files:**
- Create: `src/app/(dashboard)/dashboard/page.tsx` (replace placeholder)
- Create: `src/components/dashboard/stat-card.tsx`
- Create: `src/components/dashboard/material-chart.tsx`
- Create: `src/components/dashboard/usage-chart.tsx`
- Create: `src/components/dashboard/low-filament-alerts.tsx`
- Create: `src/components/dashboard/activity-feed.tsx`
- Create: `src/components/dashboard/recently-used.tsx`

- [ ] **Step 1: Create stat card component**

Create `src/components/dashboard/stat-card.tsx`:
- Glass-morphism card with large mono number + label
- Framer Motion counter animation on mount (number counts up from 0)
- Supports optional color override for the value

- [ ] **Step 2: Create material donut chart**

Create `src/components/dashboard/material-chart.tsx` (`"use client"`):
- Recharts `PieChart` with `Pie` (donut via `innerRadius`)
- Data: grams per material type from active spools
- Colors from `MATERIAL_COLORS` constant
- Legend showing material name + grams
- Responsive sizing

- [ ] **Step 3: Create usage bar chart**

Create `src/components/dashboard/usage-chart.tsx` (`"use client"`):
- Recharts `BarChart`
- Data: total grams used per week over last 30 days
- Aggregated from SpoolLog entries by `createdAt`
- Jade-colored bars with rounded tops
- X-axis: week labels, Y-axis: grams

- [ ] **Step 4: Create low filament alerts**

Create `src/components/dashboard/low-filament-alerts.tsx`:
- Fetch spools below user's `lowFilamentThreshold`
- Amber-tinted cards with spool name, remaining grams, progress bar (amber→red)
- Click navigates to spool detail
- "No low spools" message if all healthy

- [ ] **Step 5: Create activity feed**

Create `src/components/dashboard/activity-feed.tsx`:
- Combined feed of recent: SpoolLogs, Prints, new Spools
- Each entry: icon, description, timestamp (relative: "2 hours ago")
- Max 10 items, newest first
- Subtle hover highlight

- [ ] **Step 6: Create recently used spools section**

Create `src/components/dashboard/recently-used.tsx`:
- Horizontal scroll of 3-4 most recently used spools (by `lastUsed`)
- Mini spool cards: color dot, name, remaining grams, progress bar
- Quick-log button on each
- Click navigates to spool detail

- [ ] **Step 7: Build dashboard page**

Replace `src/app/(dashboard)/dashboard/page.tsx`:
- Server component: fetch all dashboard data (stats, charts, alerts, activity, recent)
- Layout: 4 stat cards in a row, 2-column chart grid (donut + bar), recently used section, low filament alerts, activity feed
- Page entry animation via Framer Motion
- Responsive: stats go 2x2 on mobile, charts stack vertically

- [ ] **Step 8: Verify dashboard renders with real data**

Test with a few spools, some usage logs, and a print. Verify all sections populate correctly.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: dashboard with stats, charts, activity feed, low filament alerts"
```

---

## Task 14: Settings Page

**Files:**
- Create: `src/app/(dashboard)/settings/page.tsx`
- Create: `src/app/(dashboard)/settings/actions.ts`
- Create: `src/components/settings/settings-form.tsx`
- Create: `src/components/settings/material-manager.tsx`
- Create: `src/components/settings/color-manager.tsx`
- Create: `src/components/settings/two-factor-setup.tsx`

- [ ] **Step 1: Create settings server actions**

Create `src/app/(dashboard)/settings/actions.ts` (`"use server"`):
- `getSettings(userId)` — fetch or create default UserSettings
- `updateSettings(userId, formData)` — validate, upsert UserSettings
- `addMaterial(userId, material)` — add to `materialOptions` array
- `removeMaterial(userId, material)` — remove from array (prevent removing if spools use it)

- [ ] **Step 2: Create material manager component**

Create `src/components/settings/material-manager.tsx` (`"use client"`):
- List of current materials with material-colored badges
- "Add Material" input + button
- Remove button on each (with confirmation if spools use it)
- Default material selector (dropdown from current list)

- [ ] **Step 3: Create color manager component**

Create `src/components/settings/color-manager.tsx` (`"use client"`):
- Grid of existing FilamentColors grouped by category
- "Add Custom Color" form: name, hex (with preview), optional secondary hex, category select
- Delete custom colors (prevent deleting if spools reference them)

- [ ] **Step 4: Create 2FA setup component**

Create `src/components/settings/two-factor-setup.tsx` (`"use client"`):
- Uses Better Auth's `twoFactor` client API
- "Enable 2FA" button → shows QR code for TOTP setup
- Verify with 6-digit code input
- If enabled: show "2FA Active" badge, "Disable 2FA" button
- Recovery codes display (one-time view)

- [ ] **Step 5: Create settings form**

Create `src/components/settings/settings-form.tsx` (`"use client"`):
- Sections: General, Materials, Colors, Security
- General: default mass, date format, time format, unit preference, low filament threshold
- Materials: MaterialManager component
- Colors: ColorManager component
- Security: TwoFactorSetup component
- Auto-save on change (debounced) or explicit save button

- [ ] **Step 6: Create settings page**

Create `src/app/(dashboard)/settings/page.tsx` (server component):
- Fetch user settings + filament colors
- Render SettingsForm with data

- [ ] **Step 7: Verify settings persist**

Test: change settings → reload page → verify saved. Add material → verify shows in spool form. Enable 2FA → verify works.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: settings page — materials, colors, 2FA, preferences"
```

---

## Task 15: Admin Panel

**Files:**
- Create: `src/app/(dashboard)/admin/page.tsx`
- Create: `src/app/(dashboard)/admin/actions.ts`
- Create: `src/components/admin/user-table.tsx`
- Create: `src/components/admin/user-actions.tsx`

- [ ] **Step 1: Create admin server actions**

Create `src/app/(dashboard)/admin/actions.ts` (`"use server"`):
- `getUsers()` — fetch all users with session count, last active, created date
- `toggleUserRole(userId, role)` — check caller is admin, update target user role
- `disableUser(userId)` — delete all user sessions (effectively locks them out until next login; add `banned` field to User schema in migration)
- `deleteUser(userId)` — confirm not self, cascade delete all user data

All actions verify caller has `role === "admin"` and has verified 2FA session.

- [ ] **Step 2: Create user table component**

Create `src/components/admin/user-table.tsx` (`"use client"`):
- Table columns: avatar, name, email, auth provider (GitHub/Google/email icon), role badge, created date, last active, session count
- Sortable columns
- Role badge: "admin" in jade, "user" in default
- Row actions via dropdown menu

- [ ] **Step 3: Create user actions component**

Create `src/components/admin/user-actions.tsx` (`"use client"`):
- Dropdown menu per user row:
  - "Make Admin" / "Remove Admin" toggle
  - "Disable Account"
  - "Delete Account" (destructive, with confirmation dialog)
- Prevent actions on self (can't demote yourself)

- [ ] **Step 4: Create admin page**

Create `src/app/(dashboard)/admin/page.tsx` (server component):
- Verify session user has `role === "admin"`
- If not admin, redirect to `/dashboard` or show 403
- Check 2FA is verified for this session; if not, redirect to `/settings` with toast
- Fetch all users
- Render: page title "User Management", user count stat, UserTable

- [ ] **Step 5: Add admin nav visibility**

Verify the sidebar only shows the "Admin" nav item when the user's role is "admin" (should already be handled in Task 8 sidebar component, but verify).

- [ ] **Step 6: Verify admin workflow**

Test: promote user to admin via DB → login → verify admin nav appears → verify user table loads → toggle another user's role → delete a test user.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: admin panel — user management, role toggle, 2FA-gated access"
```

---

## Task 16: Landing Page

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build landing page**

Create `src/app/page.tsx`:
- Hero section: "Respool" logo with animated gradient border, tagline "Track every gram. Plan every swap.", CTA buttons (Sign In / Get Started)
- Feature highlights: 3-4 cards showcasing key features (spool tracking, usage logging, swap calculator coming soon, self-hosted)
- Dark background with noise texture
- Glass-morphism cards for features
- Framer Motion page entry animation
- Mobile responsive
- If user is already authenticated, redirect to `/dashboard`

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: landing page with hero, feature highlights, CTAs"
```

---

## Task 17: Error Boundaries, Loading States & Polish

**Files:**
- Create: `src/components/shared/error-boundary.tsx`
- Create: `src/app/(dashboard)/spools/loading.tsx`
- Create: `src/app/(dashboard)/boxes/loading.tsx`
- Create: `src/app/(dashboard)/prints/loading.tsx`
- Create: `src/app/(dashboard)/dashboard/loading.tsx`
- Create: `src/app/(dashboard)/settings/loading.tsx`
- Create: `src/app/(dashboard)/admin/loading.tsx`

- [ ] **Step 1: Create error boundary component**

Create `src/components/shared/error-boundary.tsx` (`"use client"`):
- Catches render errors in child components
- Shows friendly error state: icon, "Something went wrong" message, "Try Again" button
- Glass-card styling consistent with design system

- [ ] **Step 2: Create loading skeletons for each page**

Create `loading.tsx` files in each route directory:
- Spools: skeleton grid of spool cards (pulsing card shapes)
- Boxes: skeleton grid of box cards
- Prints: skeleton list of print cards
- Dashboard: skeleton stat cards + chart placeholders
- Settings: skeleton form sections
- Admin: skeleton table rows

Use shadcn `Skeleton` component with design system colors.

- [ ] **Step 3: Add error boundaries to dashboard layout**

Wrap main content sections in the dashboard layout with error boundaries.

- [ ] **Step 4: Add Framer Motion page transitions**

Add to each page component:
```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
```

- [ ] **Step 5: Verify mobile responsiveness**

Test every page at 375px (mobile), 768px (tablet), 1440px (desktop):
- Spools: 1 column mobile, 2 tablet, 3-4 desktop
- Dashboard: stats 2x2 mobile, 4x1 desktop; charts stack vertically on mobile
- Sidebar: hidden on mobile, icons-only on tablet, full on desktop
- Forms: full-width on mobile, max-width on desktop

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: error boundaries, loading skeletons, page transitions, responsive polish"
```

---

## Task 18: Docker & Deployment

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Modify: `.env.example` (verify all vars documented)

- [ ] **Step 1: Create Dockerfile**

Multi-stage build per spec:
```dockerfile
FROM oven/bun:1 AS base

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bunx prisma generate
RUN bun run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    environment:
      - DATABASE_URL=postgresql://respool:${DB_PASSWORD}@db:5432/respool
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: respool
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: respool
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U respool"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
```

- [ ] **Step 3: Verify .env.example is complete**

Check all env vars are documented with comments.

- [ ] **Step 4: Test Docker build locally**

```bash
docker compose build
docker compose up -d
```

Verify app is accessible at http://localhost:3000, health check passes, database migrations run on startup.

- [ ] **Step 5: Update README with Docker instructions**

Add Docker deployment section to README: `docker compose up -d`, accessing the app, setting up admin user.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: Docker multi-stage build + docker-compose with Postgres"
```

---

## Task 19: Final Integration Verification

- [ ] **Step 1: Full workflow test**

Walk through the entire app flow:
1. Register a new account
2. Create 3-4 spools with different materials and colors
3. Log usage on several spools (including one to 0g to test auto-archive)
4. Create 2 boxes, assign spools
5. Create a pre-print, then a post-print
6. Check dashboard stats, charts, activity feed
7. Update settings (materials, threshold, date format)
8. Promote self to admin via DB, verify admin panel works
9. Test 2FA setup
10. Check all pages on mobile viewport

- [ ] **Step 2: Fix any issues found**

Address bugs or UX issues discovered during integration testing.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "fix: integration testing fixes and polish"
```

---

## Task 20: README Polish & Badges

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add shields.io badges to README header**

Add a row of stylized badges at the top of the README (after the title/description):
- TypeScript badge: `![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)`
- Next.js badge: `![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)`
- React badge: `![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)`
- Bun badge: `![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)`
- PostgreSQL badge: `![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)`
- Prisma badge: `![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)`
- Tailwind CSS badge: `![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)`
- Docker badge: `![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)`
- MIT License badge: `![License: MIT](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)`

- [ ] **Step 2: Add Buy Me a Coffee badge**

Add a Buy Me a Coffee badge/button linked to Andrew's personal BMC page. Place it in a "Support" section near the bottom of the README:

```markdown
## Support

If you find Respool useful, consider buying me a coffee!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy_Me_A_Coffee-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/YOUR_USERNAME)
```

Ask the user for their Buy Me a Coffee username to fill in the link.

- [ ] **Step 3: Polish README structure**

Ensure the README has a clean, professional structure:
1. Title + one-line description
2. Badge row (tech stack + license)
3. Screenshot placeholder (add after first full build)
4. Features list with brief descriptions
5. Quick Start (Docker) — 3 commands
6. Development Setup — local dev instructions
7. Environment Variables table
8. Admin Setup instructions
9. Tech Stack table (detailed)
10. Contributing section (brief)
11. Support section (Buy Me a Coffee)
12. License (MIT)

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: polish README with badges, structure, and Buy Me a Coffee"
```

---

## Task 21: Desloppify — Code Quality Review

- [ ] **Step 1: Run /desloppify**

Invoke the `desloppify` skill to review all changed code across the entire codebase. This will:
- Check for code reuse opportunities
- Identify quality issues
- Flag efficiency problems
- Look for consistency issues across the codebase

- [ ] **Step 2: Address findings**

Fix any issues identified by the desloppify review:
- Extract shared utilities
- Remove dead code
- Consolidate duplicated patterns
- Fix naming inconsistencies
- Optimize imports

- [ ] **Step 3: Final verification**

Run the dev server and do a quick smoke test to ensure fixes didn't break anything.

```bash
bun dev
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: desloppify — code quality cleanup and consistency fixes"
```
