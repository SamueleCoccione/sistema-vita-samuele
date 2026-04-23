# Sistema di Vita — Samuele

App personale di tracking e gestione vita. Ogni tab copre un dominio di vita specifico con dati salvati in localStorage.

## Stack

- **React 19** + **Vite 8** — build tool, no SSR
- **No TailwindCSS** — CSS custom con variabili `:root` in `src/index.css`
- **Recharts** — grafici (LineChart, BarChart)
- **Three.js** + OrbitControls — avatar 3D corporeo
- **@anthropic-ai/sdk** — chat Claude Opus con streaming

## Struttura tab

| Tab | Route | Descrizione |
|-----|-------|-------------|
| Dashboard | `/` | Panoramica e accesso rapido |
| Corpo & Mente | `/corpo-mente` | Misure corporee, progressi foto, libri, journal |
| Money & Lavoro | `/money-lavoro` | Patrimonio, transazioni, pipeline, esperimenti, benessere |
| Relazioni | `/relazioni` | (in sviluppo) |
| Libertà | `/liberta` | (in sviluppo) |
| Progetto Digitale | `/progetto-digitale` | (in sviluppo) |

## Design system

- **Sfondo**: `#f5f3ef` (crema caldo) — variabile `--bg`
- **Surface**: `#ede9e2` — variabile `--surface`
- **Accent**: `#c8f564` (lime) — variabile `--accent`
- **Navbar**: `#1a1a1a`
- **Testo**: `#1a1a1a` — variabile `--text`
- **Testo secondario**: `#7a7670` — variabile `--text2`
- **Border**: `#d4d0c8` — variabile `--border`
- **Tipografia**: uppercase bold per label e titoli sezione
- **Grain texture**: overlay fisso `.global-grain` in `App.jsx` via SVG fractalNoise, opacity 0.16

## CSS

Tutti i CSS sono importati esplicitamente nei componenti ma Vite li bundla globalmente — le classi `cm-*` di `CorpoMente.css` sono disponibili ovunque a runtime. Non usare CSS modules.

Classi utili già definite: `cm-btn`, `cm-btn-ghost`, `cm-input`, `cm-label`, `cm-empty`, `cm-section`, `cm-section-head`, `cm-section-title`, `cm-section-body`, `cm-icon-btn`.

## Persistenza

Tutto in **localStorage**. Nessun backend, nessun DB.

Prefissi chiavi:
- `sv_` — Corpo & Mente
- `ml_` — Money & Lavoro
- `sv_anthropic_key` — API key Anthropic (condivisa tra chat)

## Integrazioni attive

- **Strava OAuth** — tab Corpo & Mente, sezione attività

## Integrazioni in arrivo

- **Anthropic API** — chat Claude Opus già implementata in MoneyChat.jsx; da aggiungere anche nelle altre tab. Usa `claude-opus-4-7`, streaming con `@anthropic-ai/sdk`, `dangerouslyAllowBrowser: true`. API key salvata in `sv_anthropic_key`.

## Categorie transazioni (Money & Lavoro)

`House_Expenses`, `Bills`, `Food`, `Extra_Food`, `Extra_Drink`, `Trips`, `Knowledge`, `Wealth`, `Freelance`, `Comunit`, `Investimenti`

## Conti bancari

`BBVA`, `Unicredit`, `CC`
