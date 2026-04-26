# Sistema di Vita — Design System

Personal life-tracking dashboard by Samuele Coccione. Maps goals across all life domains: **salute (health)**, **denaro e lavoro (money & work)**, **relazioni (relationships)**, **libertà (freedom)**, and **progetti personali (personal projects)**.

---

## Sources

| Source | Location |
|---|---|
| React codebase | `sistema-vita-samuele/` (mounted via File System Access API) |
| Figma file | "10 Blurry background pack (Community)" — Figma VFS `/Blur-background`, `/Hello` |
| GitHub repo | `SamueleCoccione/sistema-vita-samuele` |

---

## Product Overview

A single-page React app with multiple tabs, each covering a life domain:

| Tab | Route | Status |
|---|---|---|
| Dashboard | `/` | Active — daily check-in with scores and streaks |
| Corpo & Mente | `/corpo-mente` | Active — body measurements, photos, book tracker, journal, Strava, Claude chat |
| Money & Lavoro | `/money-lavoro` | Active — patrimonio, transactions, CRM, experiments, wellbeing |
| Relazioni | `/relazioni` | In development |
| Libertà | `/liberta` | In development |
| Progetto Digitale | `/progetto-digitale` | In development |

**Stack:** React 19 + Vite, no Tailwind, custom CSS vars, Recharts, Three.js (3D avatar), Anthropic Claude SDK. All data stored in `localStorage`.

---

## CONTENT FUNDAMENTALS

### Voice & Tone
- **Language:** Italian throughout — labels, copy, microcopy, alerts
- **Person:** First person singular — "Ho evitato...", "Ho imparato...", "Sono uscito..." (personal reflection)
- **Tone:** Direct, motivational, almost brutalist in its honesty — "I clienti non arrivano da soli.", "Lei conta."
- **Casing:** Section/tab labels use mixed case (e.g. "Corpo & Mente"); UI labels are ALL CAPS with letter-spacing
- **Emoji:** Not used in UI; purely text + data
- **Numbers:** Italian locale formatting — `€1.200` not `$1,200`
- **Dates:** Italian locale — "lunedì 24 aprile 2025"
- **Microcopy style:** Sparse and functional. Alert messages are short jabs: "Nessun gesto oggi. Lei conta." Never padded.
- **Score/metrics framing:** Motivational streaks ("giorni consecutivi"), personal records ("record personale"), concrete thresholds (score ≥ 6/10)

### Examples of copy
- `"Buongiorno, Samuele"` — time-based greeting
- `"Nessun contatto oggi. I clienti non arrivano da soli."` — alert for missing outreach
- `"Nessun gesto oggi. Lei conta."` — relationship alert
- `"Ho evitato scroll passivo > 30 min"` — checkbox label
- `"↓ Esporta dati tab"` — action button
- `"JSON completo · per analisi con Claude Advisor"` — hint text with center dot separator

---

## VISUAL FOUNDATIONS

### Colors
| Token | Value | Use |
|---|---|---|
| `--bg` | `#f5f3ef` | Page background (warm cream) |
| `--surface` | `#ede9e2` | Cards, input backgrounds, panels |
| `--border` | `#d4d0c8` | Default 1px borders |
| `--border2` | `#b0ac9f` | Stronger borders, focus states |
| `--text` | `#1a1a1a` | Primary text, dark elements |
| `--text2` | `#6e6a62` | Secondary text, labels |
| `--text3` | `#b8b4ac` | Placeholder, tertiary, inactive |
| `--accent` | `#c8f564` | Lime — active/selected states, progress fills, badges |
| `--accent-text` | `#1a1a1a` | Text on lime accent backgrounds |
| navbar bg | `#1a1a1a` | Top navigation strip |
| hero bg | `#2d3a2e` | PageHero dark forest green |
| status-green | `#5aaa3a` | Completed / on-track |
| status-yellow | `#d4a820` | Partial / warning |
| status-red | `#b94040` | Alert / off-track |
| score-yellow | `#f0d060` | Score between 5–8 |

### Typography
- **Font family:** `system-ui, -apple-system, sans-serif` (no custom webfonts in the app)
- **Figma brand fonts:** Resolve-BlackExt, Resolve-BlackWd (bold display), Poppins (available on Google Fonts as substitute)
- **Label style:** 10px, weight 700–800, letter-spacing 0.10–0.22em, TEXT-TRANSFORM: UPPERCASE
- **Body:** 13–14px, weight 400–500, `--text2` color
- **Big numbers:** 22–48px, weight 800, letter-spacing negative (−0.02em to −0.04em)
- **Headings (PageHero):** 64px, weight 900, letter-spacing 0.04em, uppercase, white on dark

### Backgrounds & Texture
- **Global grain:** Fixed SVG fractal-noise overlay (fractalNoise, 0.75–0.80 frequency), 200×200px tile, `multiply` blend mode, opacity 0.16 — adds analog warmth to the cream background
- **PageHero grain:** Heavier grain, opacity 0.30, `overlay` blend mode on dark green
- **Blur backgrounds (Figma):** 10 photographic blurred JPEGs used for the logo/brand presentation — warm, painterly, bokeh-style photography

### Shape & Layout
- **Border radius:** 0 — everything is sharp/square, no rounded corners anywhere
- **Borders:** 1px solid only; no drop shadows, no box-shadows
- **Spacing:** Sections use 48px horizontal padding; cards use 18–28px; dense rows use 14–16px
- **Max width:** `800px` centered for content areas
- **Status indicator:** 3px top border on cards (green/yellow/red), not rounded

### Cards
- Background: `--bg` (not `--surface`)
- Border: 1px `--border`, 3px top colored by status
- No shadows, no border-radius
- Header: `14px 18px`, border-bottom 1px

### Navigation
- Dark bar `#1a1a1a`, full-width
- Links: 10px, weight 800, letter-spacing 0.18em, uppercase
- Default: `#555555`; Hover: `#ffffff`; Active: `#c8f564` (lime)
- Right border 1px `#2a2a2a` between items
- Transition: `color 0.12s`

### Interactive States
- **Hover:** `background: rgba(0,0,0,0.02)` on rows; `filter: brightness(1.08)` on primary buttons
- **Active/checked:** Lime background fill (`rgba(200,245,100,0.10)`)
- **Focus:** `border-color: var(--text)` on inputs
- **Disabled:** `opacity: 0.35`
- **Transitions:** 0.12s ease for color/border/filter; 0.35s ease for progress bars

### Animation
- Minimal — transitions only (no keyframes, no entrance animations)
- Progress bars: `transition: width 0.35s ease`
- Buttons: `transition: filter 0.12s`
- Color changes: `transition: color 0.12s`

### Progress / Data Visualization
- Progress bars: 2–3px height, `--accent` fill, `--border` track
- Charts: Recharts (LineChart, BarChart) — no custom styling specified
- Tables: 1px border-bottom rows, no row backgrounds
- Stat numbers: large (22–48px 800 weight) with small uppercase labels above

---

## ICONOGRAPHY

- **Icon system:** Custom SVG sprite at `public/icons.svg` — symbol-based, referenced via `<use href="/icons.svg#icon-name">`
- **Style:** Not determined from code exploration — likely outline/stroke style SVGs
- **Emoji:** Not used in UI
- **Unicode:** Used sparingly — `✓`, `○`, `↓` for check states and actions
- **No icon font CDN** — purely SVG sprite
- Assets copied to `assets/icons.svg` and `assets/favicon.svg`

---

## File Index

```
README.md               ← this file
SKILL.md                ← agent skill definition
colors_and_type.css     ← all CSS custom properties (colors + type)
assets/
  favicon.svg           ← app favicon
  icons.svg             ← icon sprite
preview/
  colors-base.html      ← base color swatches
  colors-semantic.html  ← semantic/status colors
  type-scale.html       ← typography scale
  type-labels.html      ← label/uppercase patterns
  spacing-tokens.html   ← spacing + border radius tokens
  components-buttons.html  ← button variants
  components-inputs.html   ← form inputs
  components-cards.html    ← card + section patterns
  components-nav.html      ← navigation bar
  components-checks.html   ← check/toggle rows
  components-badges.html   ← badges + status indicators
  brand-grain.html         ← grain texture + hero pattern
ui_kits/
  dashboard/
    README.md
    index.html          ← interactive dashboard prototype
    NavBar.jsx
    DashboardScreen.jsx
    CorpoMenteScreen.jsx
    MoneyLavoroScreen.jsx
```
