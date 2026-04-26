# Dashboard UI Kit

Interactive click-through prototype of the **Sistema di Vita** dashboard app.

## Screens

| Screen | Status |
|---|---|
| Dashboard | ✅ Full interactive daily check-in |
| Corpo & Mente | ✅ Weight tracking, book tracker, journal |
| Money & Lavoro | ✅ Patrimonio, transactions table, CRM pipeline |
| Relazioni | 🚧 In sviluppo |
| Libertà | 🚧 In sviluppo |
| Progetto Digitale | 🚧 In sviluppo |

## Files

- `index.html` — main entry, wires all screens together
- `NavBar.jsx` — top navigation bar component
- `DashboardScreen.jsx` — daily check-in with score, streaks, 4 life-domain sections
- `CorpoMenteScreen.jsx` — body weight history, book tracker with tabs, journal
- `MoneyLavoroScreen.jsx` — patrimonio with breakdown bars, transactions, CRM table

## Usage

Open `index.html` directly in browser. All data is demo/static — no localStorage writes in the kit.

## Design tokens used

All colors, spacing and type from `../../colors_and_type.css`. Key values:
- `--bg: #f5f3ef` · `--accent: #c8f564` · `--text: #1a1a1a`
- Nav: `#1a1a1a` bg, `#c8f564` active
- Hero: `#2d3a2e` with grain overlay
- No border-radius, 1px borders, flat design
