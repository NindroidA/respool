# Changelog

All notable changes to Respool are documented here.

## [1.2.1] — 2026-04-12

### Changed
- Footer redesigned — removed projects column, made "Nindroid Systems" a clickable link, updated tagline
- Added changelog link to footer resources

### Added
- CHANGELOG.md

---

## [1.2.0] — 2026-04-12

### Added
- **Multi-slicer G-code support** — auto-detects 8 slicers (EufyMake, Cura, PrusaSlicer, OrcaSlicer, BambuStudio, Simplify3D, IdeaMaker, KISSlicer)
- **Calculator refactor** — extracted `useCalculator` hook, split into focused sub-components (965 LOC → 319 LOC main file)
- **MFA / 2FA** — full enable/disable/verify flow with TOTP via Better Auth twoFactor plugin
- **Test suite** — 162 tests across 11 files (vitest) covering validators, parser, filament utils, constants, color distance, slicer profiles

### Fixed
- Error handling consistency — all catch blocks now inspect errors properly
- Type safety improvements — Prisma typed inputs, union types for roles/statuses
- 50 desloppify review findings resolved across 6 quality dimensions
- Removed unused dependencies and dead files

---

## [1.1.0] — 2026-04-12

### Added
- **Admin Dashboard Suite** — 9 modules:
  - Dashboard overview with stat cards, user growth chart, alerts panel
  - Enhanced user management with search, filters, detail views, bulk actions
  - Analytics with DAU charts, material/brand popularity, filament economy
  - Audit log viewer with category/severity filters and detail expansion
  - Security dashboard with auth events, suspicious activity detection, session management
  - System health with DB stats, table sizes, environment check, maintenance actions
  - Content management for filament colors and materials
- **Audit logging** — comprehensive `audit()` utility wired into all server actions across the entire app
- Admin layout with sub-navigation tabs

---

## [1.0.0] — 2026-04-12

### Added
- **Global footer** — "A Nindroid Systems Project" branding, version badge, resource links
- **Filament presets** — save/reuse brand+material+temp combos, community library from SpoolmanDB, auto-detect prompt for duplicates
- **QR code labels** — 4 templates (compact/standard/detailed/minimal), per-field toggle with live preview, batch download as ZIP, print-ready layouts
- **Purchase links & reorder center** — purchase URL/price/vendor per spool, reorder dashboard with low-stock alerts, usage rate predictions, shopping list, cost analytics

---

## [0.x] — 2026-03-23 to 2026-04-12

### Core Features
- Spool CRUD with rich metadata (brand, material, color, mass, diameter, temp)
- Usage logging with quick-log from spool cards
- Boxes for organizing spools with drag-and-drop assignment
- Print tracking with dual-mode flow (pre-print planning, post-print logging)
- Dashboard with stat cards, material charts, usage charts, activity feed, low filament alerts
- Spool swap calculator with per-layer G-code parsing
- Settings page with material options, date/time format, units, low filament threshold
- Admin panel with user management (role toggle, ban/unban, delete)
- Profile page with account stats, edit name, connected accounts, 2FA status

### Design System
- Jade green gradient color system (5 green tones across UI elements)
- Custom material type colors (8 materials, each with unique color)
- Filament color database with 70+ curated colors across 7 categories
- Framer Motion animations, glass-morphism cards, gradient borders
- Responsive layout: desktop sidebar, tablet collapsible, mobile bottom nav

### Infrastructure
- Better Auth with email/password, GitHub OAuth, Google OAuth, TOTP 2FA
- PostgreSQL 17 via Docker with Prisma ORM
- Docker multi-stage build (bun for deps/build, node:22-alpine for runtime)
- GitHub Actions deploy pipeline with concurrency control and auto-rollback
- Self-hosted on Prizmo behind nginx + Cloudflare DNS

### Quality
- TypeScript strict mode, Zod validation on all forms + server actions
- Sequential spool numbering (Bambu-style, never reuses)
- Auto-box creation by color similarity (CIE76 Delta-E in LAB space)
- Dual-color filament support with diagonal split swatches
- Custom StyledSelect component replacing all native dropdowns
- Shared `requireUser()` / `requireAdmin()` auth helpers with banned-user checks
- Desloppify score: 80.0/100 strict (20-dimension subjective review completed)
