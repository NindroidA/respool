# Respool — Feature Specification

## Phase 1: Core (MVP)

Feature parity with filatrack, plus quality-of-life improvements.

---

### 1. Filament Spool Management

**CRUD operations on spools with rich metadata.**

Fields:
- **Name** — user-defined label (e.g., "Generic White PLA")
- **Brand** — manufacturer (e.g., "Hatchbox", "eSUN", "AnkerMake")
- **Color** — hex value with visual color picker swatch
- **Material** — selectable from user's material list (PLA, PETG, ABS, TPU, etc.)
- **Starting mass** — original spool weight in grams (default 1000g)
- **Current mass** — remaining grams (auto-updated when logging usage)
- **Diameter** — filament diameter in mm (default 1.75)
- **Printing temperature** — recommended nozzle temp in °C
- **Cost** — purchase price (stored as cents, displayed as dollars/currency)
- **Note** — free-text field for any additional info
- **Box** — optional assignment to a storage box

Features:
- Visual progress bar showing remaining % (color shifts from green → amber → red as depleted)
- Duplicate spool (copy all fields, reset mass to starting)
- Archive spool (hide from active list, keep for history)
- Delete spool (with confirmation, cascades to logs)
- Sort by: name, brand, material, remaining mass, last used, date added
- Filter by: material, box, archived status, low filament threshold
- Search across name, brand, material, notes

**QR Codes:**
- Generate a QR code per spool linking to its detail page (e.g., `/spools/{shortId}`)
- Short IDs for compact QR codes (8 characters)
- Printable QR sheet for labeling physical spools
- QR scan opens spool detail page directly

---

### 2. Filament Usage Logging

**Track every time filament is used from a spool.**

Each log entry contains:
- Grams used (integer)
- Optional note (e.g., "benchy test print", "failed halfway")
- Auto-recorded: previous mass, new mass, timestamp

Behavior:
- Logging automatically deducts from spool's current mass
- Timeline view per spool showing usage history
- Ability to edit/delete log entries (recalculates mass)
- Quick-log action accessible from spool card (no page navigation needed)

---

### 3. Boxes (Organizational Containers)

**Group physical spools into labeled storage containers.**

Fields:
- Name (e.g., "Shelf A", "Drawer 3", "PLA Box")
- Display order (drag-and-drop reorder)

Features:
- Color swatch strip showing filament colors inside the box
- Spool count and total mass displayed on box card
- Drag-and-drop spools between boxes (using @dnd-kit or Framer Motion Reorder)
- Unboxed spools section for spools not assigned to any box
- Click box to see contents with spool cards

---

### 4. Print Tracking

**Log completed prints and associate them with spools.**

Fields:
- Print name
- Print time (hours and minutes)
- Filament(s) used: one or more spools with grams per spool
- Optional notes

Features:
- Multi-spool prints (assign grams to each spool separately)
- Auto-log filament usage to each associated spool
- Print history with search and date filtering
- Total filament used and total print time stats

---

### 5. Dashboard

**Overview page — the default landing after login.**

Stats cards:
- Total spools (active)
- Total filament available (sum of all current mass)
- Total filament used (sum of all logs)
- Average spool utilization %

Charts (Recharts):
- Pie/donut: filament by material type (grams)
- Bar: usage over time (last 30 days, weekly buckets)
- Progress bars: lowest spools (running low warnings)

Activity feed:
- Recent logs, prints, spool additions
- Timestamped, most recent first

Low filament alerts:
- Spools below configurable threshold (default: 100g) highlighted with amber badge

---

### 6. Settings

User-configurable preferences:

- **Material picker options** — add/remove materials from the dropdown list
- **Default material** — pre-selected when adding new spool
- **Default mass** — pre-filled starting mass for new spools
- **Date format** — MM/dd/yyyy, dd/MM/yyyy, yyyy-MM-dd
- **Time format** — 12h or 24h
- **Unit preference** — grams or ounces (display only, stored as grams)
- **Low filament threshold** — grams remaining to trigger warnings

---

### 7. Authentication

**Better Auth with GitHub, Google, and email/password.**

- Login page with OAuth buttons + email/password form
- Registration page for email/password sign-up
- Session management (automatic refresh, secure cookies)
- User profile: name, avatar (from OAuth provider), email
- Sign out from sidebar

---

### 8. Spool Swap Calculator

**The killer feature. Calculate exactly where to pause and swap filament spools during a print.**

Two modes:
1. **G-code upload (accurate)** — parses actual per-layer extrusion data
2. **Manual entry (estimate)** — linear approximation from total grams ÷ total layers

Inputs:
- G-code file upload (parsed client-side, never sent to server) OR manual total grams + layers
- Spools in print order, each with remaining grams
- Material/filament type selector (affects density for mm→grams conversion)
- Purge per swap: mm of filament extruded each time a spool is loaded (default 100mm)

Calculations:
- Convert purge mm to grams based on filament diameter and material density
- Deduct purge from each spool's effective capacity (including initial load)
- Walk through layers, consuming from current spool until exhausted
- Record swap points as layer numbers

Outputs:
- Stat cards: total available, total needed, purge waste, enough/short
- Pause schedule: per-spool breakdown with layer ranges, grams used, purge
- **Quick reference section formatted for EufyMake Studio:**
  - Shows the layer number to SET THE MARKER ON (first layer of NEXT spool)
  - EufyMake pauses BEFORE printing the marked layer, so the marker goes on the first layer the new spool will print
  - Explanatory note clarifying this behavior

See `GCODE_PARSER.md` for parser implementation details.

---

### 9. Search & Command Palette

**⌘K / Ctrl+K to open a global search overlay.**

Sections:
- **Spools** — fuzzy search by name, brand, material, color name
- **Boxes** — search by box name
- **Prints** — search by print name
- **Quick Actions** — add spool, log usage, open calculator, go to settings

Implementation:
- `cmdk` library for the palette UI
- Client-side fuzzy search over data already loaded
- Keyboard navigable (arrow keys, enter to select, escape to close)
- Available on every authenticated page via the dashboard layout

---

### 10. Future-Ready: Slicer Integration API

**Not built in Phase 1, but architecture should support it.**

Plan for an API endpoint that could receive print data from a post-processing script (similar to filatrack's PrusaSlicer integration):
- `POST /api/integrations/slicer` accepting G-code metadata (filament used, print name, layer count, time)
- Auth via API key (per-user)
- Creates an "unreviewed" print that the user can then assign spools to

For now, just stub the route and data model — actual implementation is Phase 3.

---

## Feature Priority Matrix

| Feature | Priority | Complexity | Phase |
|---------|----------|------------|-------|
| Spool CRUD | P0 | Medium | 1 |
| Usage logging | P0 | Low | 1 |
| Auth (Better Auth) | P0 | Medium | 1 |
| Dashboard | P1 | Medium | 1 |
| Boxes | P1 | Medium | 1 |
| Print tracking | P1 | Medium | 1 |
| Settings | P1 | Low | 1 |
| QR codes | P2 | Low | 1 |
| **Swap Calculator** | **P0** | **High** | **1** |
| Command palette | P1 | Medium | 2 |
| Slicer API (stub) | P3 | Low | 2 |
