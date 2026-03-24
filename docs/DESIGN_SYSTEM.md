# Respool — Design System

## Theme: Dark, Techy, Futuristic

Respool should feel like a **control dashboard for a 3D printing lab** — dark backgrounds, glowing accents, glass-morphism panels, subtle animated gradients. NOT generic dark mode. This has personality and feels premium.

---

## Color Palette

### Backgrounds
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#09090b` | Page background |
| `--bg-raised` | `#0a0a0c` | Slightly raised sections |
| `--bg-surface` | `#111113` | Content area background |
| `--bg-card` | `#1c1c1f` | Card backgrounds |
| `--bg-card-hover` | `#222225` | Card hover state |
| `--bg-input` | `#1c1c1f` | Form input backgrounds |

### Borders
| Token | Value | Usage |
|-------|-------|-------|
| `--border-default` | `#2e2e33` | Card and input borders |
| `--border-subtle` | `#222226` | Dividers, separators |
| `--border-focus` | `#10b981` | Focus ring color |

### Accent Colors — Green Gradient System (Jade Anchor)
| Token | Value | Usage |
|-------|-------|-------|
| `--accent-jade` | `#10b981` | Primary actions, links, highlights |
| `--accent-jade-hover` | `#059669` | Primary hover states |
| `--accent-jade-muted` | `rgba(16,185,129,0.15)` | Primary subtle backgrounds |
| `--accent-neon` | `#4ade80` | Success states, progress highlights |
| `--accent-emerald` | `#34d399` | Secondary accent |
| `--accent-mint` | `#6ee7b7` | Light accent, tags |
| `--accent-teal` | `#2dd4bf` | Tertiary accent |
| `--color-warning` | `#fbbf24` | Warnings, pause markers |
| `--color-error` | `#f87171` | Errors, "not enough filament" |

### Text
| Token | Value | Usage |
|-------|-------|-------|
| `--text-primary` | `#f4f4f5` | Headings, primary content |
| `--text-secondary` | `#a1a1aa` | Body text, descriptions |
| `--text-muted` | `#71717a` | Placeholder, disabled |
| `--text-faint` | `#52525b` | Labels, hints, timestamps |

---

## Typography

### Font Stack
```css
--font-sans: 'Geist Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
```

### Usage Rules
- **Geist Sans** — all UI text: navigation, labels, buttons, body copy, descriptions
- **Geist Mono** — all data/numeric values: filament weights, layer numbers, temperatures, costs, IDs, timestamps, code-like content

### Scale
| Name | Size | Weight | Font | Usage |
|------|------|--------|------|-------|
| Page title | 24px | 600 | Sans | Page headings |
| Section title | 18px | 600 | Sans | Card/section headings |
| Body | 14px | 400 | Sans | General text |
| Small | 13px | 400 | Sans | Secondary text |
| Label | 12px | 500 | Sans | Form labels |
| Overline | 10px | 700 | Sans | Section labels (uppercase, `tracking-widest`) |
| Data large | 18-24px | 700 | Mono | Stat values, big numbers |
| Data body | 14-15px | 400-500 | Mono | Inline data, weights, costs |
| Data small | 11-12px | 400 | Mono | Timestamps, IDs |

---

## Glass & Glow Effects

### Glass-morphism Cards
```css
.glass-card {
  background: rgba(28, 28, 31, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(46, 46, 51, 0.5);
  border-radius: 12px;
}
```

### Glow Effects
```css
/* Subtle ambient glow on focused/active cards */
.glow-jade {
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.1),
              0 0 40px rgba(16, 185, 129, 0.05);
}

/* Stronger glow for primary buttons on hover */
.glow-jade-strong {
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.3),
              0 0 30px rgba(16, 185, 129, 0.15);
}

/* Amber glow for warnings/pauses */
.glow-amber {
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.1),
              0 0 40px rgba(251, 191, 36, 0.05);
}
```

### Animated Gradient Border (Hero Cards)
Use Framer Motion to rotate a conic-gradient behind a card, masked to only show as a border:
```tsx
// Concept: outer wrapper has the animated gradient,
// inner card overlays it with solid bg, leaving gradient visible as a 1-2px border
<motion.div
  className="relative rounded-xl p-px"
  style={{
    background: "conic-gradient(from var(--angle), #10b981, #059669, #047857, #10b981)"
  }}
  animate={{ "--angle": ["0deg", "360deg"] }}
  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
>
  <div className="rounded-xl bg-[#111113] p-6">
    {/* card content */}
  </div>
</motion.div>
```

### Noise Texture
Subtle grain overlay on page backgrounds for depth:
```css
.noise-overlay::before {
  content: "";
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,..."); /* tiny noise SVG */
  opacity: 0.03;
  pointer-events: none;
  z-index: 1;
}
```

---

## Component Styles

### Buttons
| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `#10b981` (jade) | `#09090b` | none | glow + darken to `#059669` |
| Secondary | transparent | `#a1a1aa` | `#2e2e33` | bg `#222225`, glow subtle |
| Ghost | transparent | `#71717a` | none | bg `#1c1c1f` |
| Destructive | `#7f1d1d` | `#fca5a5` | none | bg `#991b1b` |

### Inputs
```css
.input {
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  padding: 10px 12px;
  font-size: 14px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus {
  border-color: var(--accent-jade);
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
  outline: none;
}
```

### Cards
```
- Background: glass-card or solid var(--bg-card)
- Border: 1px solid var(--border-default)
- Border-radius: 12px (rounded-xl)
- Padding: 16-20px
- Hover: subtle scale (1.01-1.02) via Framer Motion, border brightens
```

### Badges / Tags
| Type | Background | Text |
|------|-----------|------|
| Material tag (PLA, PETG) | `rgba(16,185,129,0.1)` | `#10b981` |
| Pause marker | `#422006` | `#fbbf24` |
| Done/success | `#052e16` | `#4ade80` |
| Warning/short | `#2a1215` | `#fca5a5` |

### Data Stat Cards
Large number displays used on the dashboard and calculator results:
```
- Background: var(--bg-card)
- Border: 1px solid var(--border-default)
- Border-radius: 8px
- Padding: 12-14px
- Value: font-mono, 18-24px, font-bold, var(--text-primary)
- Label: 11px, var(--text-faint), margin-top 2px
```

---

## Animation Patterns (Framer Motion)

### Page Transitions
```tsx
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: "easeOut" }}
>
  {children}
</motion.div>
```

### Staggered List Entry
```tsx
<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.05, duration: 0.25 }}
>
  <SpoolCard spool={spool} />
</motion.div>
```

### Card Hover
```tsx
<motion.div
  whileHover={{ scale: 1.015 }}
  whileTap={{ scale: 0.985 }}
  transition={{ type: "spring", stiffness: 400, damping: 25 }}
>
  {/* card content */}
</motion.div>
```

### Number Counter Animation
Animate stat values when they change (e.g., total filament available):
```tsx
<motion.span
  key={value}
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  className="font-mono font-bold"
>
  {value}g
</motion.span>
```

### Drawer / Sheet
Use `vaul` for mobile drawers with spring physics:
```tsx
<Drawer.Root>
  <Drawer.Trigger asChild>
    <Button>Open</Button>
  </Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
    <Drawer.Content className="glass-card ...">
      {/* content */}
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
```

---

## Layout

### Desktop
```
┌────────────────────────────────────────────────┐
│ ┌──────┐ ┌──────────────────────────────────┐  │
│ │      │ │                                  │  │
│ │ Side │ │        Main Content              │  │
│ │ bar  │ │        (max-w-6xl mx-auto)       │  │
│ │      │ │                                  │  │
│ │ Nav  │ │                                  │  │
│ │      │ │                                  │  │
│ └──────┘ └──────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

### Mobile
```
┌──────────────────┐
│   Hamburger / ≡  │  ← Top bar with app name + menu toggle
├──────────────────┤
│                  │
│   Main Content   │
│   (full width)   │
│                  │
│                  │
├──────────────────┤
│ 🏠  📦  🖨  ⚙️  │  ← Bottom tab navigation
└──────────────────┘
```

### Sidebar Items
- Dashboard (home icon)
- Spools (cylinder/spool icon)
- Boxes (box icon)
- Prints (printer icon)
- Calculator (calculator icon)
- Settings (gear icon)
- User avatar + sign out at bottom

### Command Palette (cmdk)
Triggered by `⌘K` / `Ctrl+K`, or a search icon in the sidebar:
```
┌──────────────────────────────────────┐
│ 🔍  Search spools, actions...        │
├──────────────────────────────────────┤
│ SPOOLS                               │
│   Generic PLA White — 450g           │
│   Hatchbox PETG Black — 230g         │
│ ACTIONS                              │
│   Add new spool                      │
│   Open calculator                    │
│   Log filament usage                 │
│ PAGES                                │
│   Dashboard                          │
│   Settings                           │
└──────────────────────────────────────┘
```
Glass-morphism surface, fuzzy search, keyboard navigable.

---

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| Mobile | < 640px | Single column, bottom nav, drawers for detail views |
| Tablet | 640-1024px | Collapsible sidebar, 2-column grids |
| Desktop | > 1024px | Full sidebar, 3-4 column grids, spacious layout |

---

## shadcn/ui Configuration

When initializing shadcn/ui, use the "New York" style variant and customize the theme to match the design system above. Override the default CSS variables in `globals.css` to use our color palette. All shadcn components should be generated into `src/components/ui/`.
