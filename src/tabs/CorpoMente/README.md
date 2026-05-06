# Corpo & Mente — Architettura bento

## Struttura

```
src/
├── design/
│   └── tokens.css              # CSS custom properties (colori, spacing, radius, font)
├── components/primitives/
│   ├── primitives.css          # Stili condivisi per tutte le primitive
│   ├── GrainMesh.jsx           # Sfondo mesh animato viola/arancio con SVG noise
│   ├── BentoCard.jsx           # Wrapper card (eyebrow, title, action, grain overlay)
│   ├── ProgressRing.jsx        # Anello SVG con gradient animato
│   ├── StatNumber.jsx          # Numero con count-up 800ms easeOutCubic
│   ├── StreakCounter.jsx       # Giorni + fiamma SVG custom
│   ├── ChipTag.jsx             # Pill colorata (neutral/success/warning/magenta/teal)
│   ├── SectionTitle.jsx        # Eyebrow teal + titolo bold
│   ├── EmptyState.jsx          # Stato vuoto con CTA
│   └── Drawer.jsx              # Pannello slide-in da destra (fullscreen su mobile)
└── tabs/CorpoMente/
    ├── HeroSection.jsx         # Score gigante + trend sparkline + insights settimana
    ├── HeroSection.css
    ├── BentoLayout.jsx         # Shell 12-colonne — importa tutti i moduli
    ├── BentoLayout.css         # Grid CSS + responsive breakpoints
    └── modules/
        ├── modules.css             # Stili condivisi per i moduli
        ├── WeightModule.jsx        # Peso: AreaChart + delta + ultimo valore
        ├── StravaStreakModule.jsx  # Rucking: ProgressRing sessioni settimana
        ├── NutritionTodayModule.jsx# Kcal oggi vs TDEE + macro bar
        ├── WeeklyGoalsModule.jsx   # Goals: ProgressRing + checklist preview
        ├── SleepModule.jsx         # Sonno: EmptyState (Apple Health prossimamente)
        ├── BooksModule.jsx         # Libro in corso + contatori
        ├── FilmsModule.jsx         # Ultimi 3 poster + watchlist counter
        ├── JournalModule.jsx       # Ultime 3 entry + tag colorati
        ├── PhotosModule.jsx        # Foto ultima sessione + CTA
        └── BodyMeasuresModule.jsx  # Vita/fianchi/peso con delta
```

## Pattern modulo

Ogni modulo è auto-contenuto:
1. **Card riassuntiva** — metrica protagonista + dati di supporto
2. **Click → Drawer** — pannello con il componente originale completo
3. **Zero duplicazione logica** — i drawer rendono i componenti legacy esistenti

## Grid layout desktop (12 colonne)

| Row | Col 1-6 | Col 7-9 | Col 10-12 |
|-----|---------|---------|-----------|
| 1   | Peso (row-span 2) | Strava | Nutrizione |
| 2   |         | Goals   | Sonno |
| 3-4 | Libri   | Film    | Journal |
| 5   | Foto    | Misure corpo ||

## Tono e debiti — Regole di product design

### Principio

Il debito (libri non finiti, obiettivi non raggiunti) è un **dato**, non un giudizio. La UI lo comunica con tono editoriale e fattuale. Non punisce, non allerta, non urla.

### Regole inderogabili

| ✅ Fare | ❌ Non fare |
|---------|------------|
| `2 libri da recuperare` | `In ritardo di 2 libri!` |
| Color `ink` / `ink-muted` / `success` | Color `flame` / `magenta` saturo / rosso |
| Tipografia italic serif per testo narrativo | Bold rosso su numeri di debito |
| Icona `clock-rewind` neutra | Icona warning/triangolo/allarme |
| Mostra la settimana più vecchia come dato storico | "Stai fallendo dal 22 aprile" |
| `Azzera debito` come opzione silenziosa in fondo | `Azzera debito` come CTA prominente |

### Come funziona il debito libri (V7)

```
carriedDebt = max(0, weeksPassed × weeklyTarget − booksDoneBeforeThisWeek)
totalDue    = weeklyTarget + carriedDebt
```

- `sv_book_system_start` — lunedì da cui parte il conteggio (scritto alla prima apertura)
- Reset manuale: in Drawer Libreria > Impostazioni, bottone secondario con conferma
- Libri `abandoned` non contano né come completati né abbassano il debito
- Libri `done` senza `endDate` vengono ignorati (log warning)

### Come funziona il doppio binario film (V7)

Due counter indipendenti, nessun accumulo:
- **Settimanale**: `sv_film_goal_week` (default 2) — reset ogni lunedì
- **Mensile**: `sv_film_goal` (default 8) — reset ogni primo del mese
- **Annuale**: calcolato a runtime = 12 × mensile

I counter diventano verdi (`color-success`) quando raggiungono il target. Non ci sono penalità se non raggiunti.

## Token principali

| Token | Valore | Uso |
|-------|--------|-----|
| `--color-surface` | `#F5EDDD` | Background card |
| `--color-teal` | `#2BB3A8` | Progresso positivo |
| `--color-flame` | `#FF6B35` | Streak/warning |
| `--color-magenta` | `#E0428A` | Achievement/alert |
| `--font-display` | Instrument Serif | Numeri hero |
| `--font-mono` | JetBrains Mono | KPI / date |
