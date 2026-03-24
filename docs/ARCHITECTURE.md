# Respool — Architecture Reference

## System Overview

```
┌──────────────────────────────────────────────────┐
│                 Client (Browser)                  │
│  Next.js App Router │ React 19 │ Framer Motion    │
│  shadcn/ui │ Tailwind v4 │ Recharts │ cmdk        │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │  G-Code Parser (client-side only)            │ │
│  │  FileReader → parse → per-layer extrusion    │ │
│  │  Never leaves the browser                    │ │
│  └──────────────────────────────────────────────┘ │
└────────────────┬─────────────────────────────────┘
                 │ HTTPS
┌────────────────▼─────────────────────────────────┐
│             Next.js Server (Node.js)              │
│                                                   │
│  ┌───────────┐  ┌────────────┐  ┌─────────────┐  │
│  │ App Router│  │ Better Auth│  │  Server     │  │
│  │ (pages,   │  │ (sessions, │  │  Actions    │  │
│  │  RSC)     │  │  OAuth)    │  │  (mutations)│  │
│  └───────────┘  └──────┬─────┘  └──────┬──────┘  │
│                        │               │          │
│               ┌────────▼───────────────▼───────┐  │
│               │          Prisma ORM            │  │
│               │   (typed queries, migrations)  │  │
│               └────────────────┬───────────────┘  │
└────────────────────────────────┼──────────────────┘
                                 │ TCP :5432
┌────────────────────────────────▼──────────────────┐
│             PostgreSQL 17 (Docker)                 │
│           Volume: pgdata (persistent)              │
└───────────────────────────────────────────────────┘
```

## Data Flow Patterns

### Server Components (default)
Pages and layouts are server components by default. They query Prisma directly and pass data as props. No client-side fetching for initial page loads.

```
Page (server) → Prisma query → render HTML → stream to client
```

### Client Components
Interactive elements (forms, modals, drag-and-drop, calculator) use the `"use client"` directive. They receive initial data via props from parent server components and use Server Actions for mutations.

```
Server Component (data fetch) → Client Component (interactivity) → Server Action (mutation)
```

### Server Actions
All data mutations go through Next.js Server Actions. These are typed async functions that run on the server, callable directly from client components. Every action must:

1. Verify the user's session via Better Auth
2. Validate input with Zod
3. Perform the Prisma operation
4. Return typed results or throw typed errors

```typescript
// Example pattern: src/app/(dashboard)/spools/actions.ts
"use server"

import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { createSpoolSchema } from "@/lib/validators"
import { headers } from "next/headers"

export async function createSpool(formData: FormData) {
  const session = await getSession(await headers())
  if (!session) throw new Error("Unauthorized")

  const validated = createSpoolSchema.parse(Object.fromEntries(formData))

  return prisma.spool.create({
    data: { ...validated, userId: session.user.id }
  })
}
```

### G-Code Parser (client-only)
The spool swap calculator parses G-code entirely in the browser. No file data is ever sent to the server. See `GCODE_PARSER.md` for full implementation details.

```
FileReader.readAsText() → parseGcode() → per-layer data → calculateSwapPoints() → render schedule
```

---

## Authentication Flow (Better Auth)

### Setup

```typescript
// src/lib/auth.ts — Server-side config
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
})

// Helper for server components / server actions
export async function getSession(headers: Headers) {
  return auth.api.getSession({ headers })
}
```

```typescript
// src/lib/auth-client.ts — Client-side helpers
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL!,
})

export const { signIn, signOut, useSession } = authClient
```

```typescript
// src/app/api/auth/[...all]/route.ts — Route handler
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { POST, GET } = toNextJsHandler(auth)
```

### OAuth Flow
1. User clicks "Sign in with GitHub/Google"
2. Better Auth client redirects to provider
3. Provider redirects back to `/api/auth/callback/{provider}`
4. Better Auth creates/updates User + Account + Session via Prisma
5. Session cookie set on response
6. Middleware validates session on subsequent requests

### Proxy (Route Protection)
```typescript
// src/proxy.ts (Next.js 16 convention, replaces deprecated middleware.ts)
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const AUTH_PAGES = ["/login", "/register"]
const PROTECTED_PREFIXES = [
  "/dashboard", "/spools", "/boxes", "/prints",
  "/calculator", "/settings", "/admin",
]

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("better-auth.session_token")
  const { pathname } = request.nextUrl

  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p))
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

  if (isProtected && !sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (isAuthPage && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
}
```

---

## Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Better Auth managed tables ─────────────────────

model User {
  id                String    @id
  name              String
  email             String    @unique
  emailVerified     Boolean   @default(false)
  image             String?
  role              String    @default("user") // "user" | "admin"
  banned            Boolean   @default(false)
  twoFactorEnabled  Boolean   @default(false)
  lastAccessed      DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  sessions   Session[]
  accounts   Account[]
  spools     Spool[]
  boxes      Box[]
  prints     Print[]
  settings   UserSettings?
  twoFactors TwoFactor[]
}

model Session {
  id        String   @id
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Account {
  id                    String    @id
  accountId             String
  providerId            String
  userId                String
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  accessToken           String?
  refreshToken          String?
  idToken               String?
  accessTokenExpiresAt  DateTime?
  refreshTokenExpiresAt DateTime?
  scope                 String?
  password              String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// ─── Application tables ─────────────────────────────

model Spool {
  id       String @id @default(cuid())
  shortId  String @unique @default(cuid())
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  name     String
  brand    String
  color    String   // hex, e.g. "#FF5733"
  material String   // e.g. "PLA", "PETG"
  note     String   @default("")

  currentMass  Int  // grams
  startingMass Int  // grams

  diameter            Float?  // mm, e.g. 1.75
  printingTemperature Int?    // °C
  cost                Int?    // cents (e.g. 2499 = $24.99)

  filamentColorId String?
  filamentColor   FilamentColor? @relation(fields: [filamentColorId], references: [id], onDelete: SetNull)

  boxId    String?
  box      Box?     @relation(fields: [boxId], references: [id], onDelete: SetNull)

  archived     Boolean  @default(false)
  displayOrder Int      @default(0)
  lastUsed     DateTime @default(now())
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  logs           SpoolLog[]
  printFilaments PrintFilament[]
}

model SpoolLog {
  id       String @id @default(cuid())
  spoolId  String
  spool    Spool  @relation(fields: [spoolId], references: [id], onDelete: Cascade)

  gramsUsed    Int
  note         String?
  previousMass Int
  newMass      Int

  createdAt DateTime @default(now())
}

model Box {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  name         String
  displayOrder Int @default(0)

  spools    Spool[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Print {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  name             String
  notes            String?
  printTimeMinutes Int?    // nullable for pre-print mode
  totalGramsUsed   Int
  status           String  @default("completed") // "planned" | "in_progress" | "completed"
  estimatedGrams   Int?    // slicer estimate (pre-print mode)
  estimatedLayers  Int?    // slicer estimate (pre-print mode)

  filaments PrintFilament[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model PrintFilament {
  id       String @id @default(cuid())
  printId  String
  print    Print  @relation(fields: [printId], references: [id], onDelete: Cascade)
  spoolId  String
  spool    Spool  @relation(fields: [spoolId], references: [id], onDelete: Cascade)

  gramsUsed Int
}

model UserSettings {
  userId String @id
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  materialOptions      String[] @default(["PLA", "PETG", "ABS", "TPU", "ASA", "PC", "HIPS", "PVA"])
  dateFormat           String   @default("MM/dd/yyyy")
  timeFormat           String   @default("12h")
  defaultMaterial      String   @default("PLA")
  defaultMass          Int      @default(1000) // grams
  unitPreference       String   @default("grams") // "grams" | "oz"
  lowFilamentThreshold Int      @default(100) // grams remaining to trigger warnings
}

model TwoFactor {
  id          String @id
  secret      String
  backupCodes String
  userId      String
  user        User   @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model FilamentColor {
  id           String  @id @default(cuid())
  name         String  // e.g. "Silk Gold", "Matte Black"
  hex          String  // primary hex, e.g. "#D4AF37"
  hexSecondary String? // for dual-color filaments
  category     String  // "solid" | "silk" | "matte" | "dual" | "translucent" | "glow" | "marble"
  sortOrder    Int     @default(0)

  spools Spool[]

  @@unique([name, category])
}
```

---

## Deployment (Docker on Prizmo)

### docker-compose.yml
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

### Dockerfile (multi-stage)
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

### Environment Variables (.env.example)
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

### Reverse Proxy
Designed to sit behind nginx reverse proxy on Prizmo, with Cloudflare DNS and TLS terminated externally.

---

## Error Handling Strategy

### Client
- **Form validation:** Zod schemas with inline error messages
- **Mutations:** Server Actions wrapped in try/catch, errors shown via Sonner toasts
- **Network failures:** graceful degradation, retry where appropriate
- **Error Boundaries:** wrap major page sections, render friendly fallback UI

### Server
- **Server Actions:** validate input → check auth → catch Prisma errors → return typed result
- **Prisma errors:** catch specific codes (`P2002` unique constraint, `P2025` not found, etc.)
- **Auth errors:** redirect to login on session expiry
- **Health endpoint:** `GET /api/health` returns `{ status: "ok" }` for Docker health checks
