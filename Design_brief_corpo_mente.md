{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # REDESIGN: Tab "Corpo & Mente" \'97 Sistema di Vita\
\
## RUOLO\
Sei un senior product designer + frontend engineer specializzato in dashboard per startup AI/wellness. Lavori in modo iterativo: design system prima, componenti primitivi dopo, layout bento alla fine. Non fare tutto in un commit. Procedi modulo per modulo.\
\
## CONTESTO TECNICO\
- Stack: React 19, Vite 8, Firebase 12, Recharts 3, Three.js 0.184\
- L'app gira in locale, sar\'e0 migrata online presto. Mobile-friendly obbligatorio anche se l'uso primario adesso \'e8 desktop.\
- Esiste gi\'e0 una tab "Corpo & Mente" funzionante con queste sezioni: stato_obiettivo (score 1-10), obiettivi_settimanali (checkbox), misure_corpo, foto_progressi_sessioni, storico_peso, attivita_strava, nutrizione_voci, libri, film_visti, film_da_vedere, journal, chat_claude.\
\
## OBIETTIVO\
Trasformare visivamente la tab "Corpo & Mente" da "sito HTML anni 90" a dashboard moderna stile startup AI. Ogni sezione esistente diventa un **modulo bento** (mini-app) all'interno della tab. Il punteggio complessivo dell'obiettivo e gli Insight Settimanali restano in cima come hero. Tutto il resto va in un bento grid sotto.\
\
## VINCOLI ASSOLUTI\
- **NON toccare il data layer Firebase**. Schema, ID, query: tutto resta com'\'e8.\
- **NON rimuovere funzionalit\'e0 esistenti**. Ogni sezione del JSON deve restare editabile/leggibile.\
- **NON aggiungere dipendenze pesanti** (no Material UI, no Chakra, no Ant Design). Tailwind o CSS Modules + componenti custom.\
- **NON cadere nel cringe**: niente confetti, niente mascotte, niente animazioni infantili tipo Duolingo, niente metriche caotiche tipo Strava (10 numeri ammucchiati senza gerarchia).\
\
## DIREZIONE VISIVA\
\
Riferimenti positivi: Suno (palette + grain), Notion (calma, gerarchia, leggibilit\'e0), Apple Fitness (ring + numeri grossi), Linear (precisione tipografica).\
\
Riferimenti negativi: Strava (caotico), Duolingo (infantile), Bootstrap default (banale).\
\
### Design tokens (crea PRIMA di tutto: file `src/design/tokens.css` o `src/design/tokens.ts`)\
\
**Colori:**\
```css\
--color-bg-warm: #B86A3D;       /* arancione caldo, lato sx mesh */\
--color-bg-deep: #6B3A6F;       /* viola profondo, lato dx mesh */\
--color-bg-accent: #2A1B2E;     /* viola quasi nero per contrasto */\
--color-surface: #F5EDDD;       /* card cream calda */\
--color-surface-alt: #FFF8EA;   /* card pi\'f9 chiara per gerarchia */\
--color-ink: #1F1812;           /* testo principale */\
--color-ink-muted: #6B5D52;     /* testo secondario */\
--color-line: #E5D9C2;          /* bordi sottili */\
--color-magenta: #E0428A;       /* accento "achievement" */\
--color-teal: #2BB3A8;          /* accento "progresso positivo" */\
--color-flame: #FF6B35;         /* streak/fuoco */\
--color-success: #4A9B6E;       /* obiettivo raggiunto */\
```\
\
**Tipografia (Google Fonts):**\
- Display / hero: **Instrument Serif** (per numeri grandi, titoli emotivi tipo "Welcome to Suno")\
- UI / body: **Inter** (peso 400, 500, 700) con `font-feature-settings: "ss01", "cv11"` e `tabular-nums` per numeri\
- Mono numeri precisi: **JetBrains Mono** (peso 500) per kpi e statistiche\
\
**Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64 (px). Niente di intermedio.\
\
**Radius:** 16px (card piccola), 24px (card media), 32px (hero). Niente quadrati.\
\
**Shadow:** una sola, soft: `0 8px 32px rgba(31, 24, 18, 0.08)`. Hover: `0 12px 40px rgba(31, 24, 18, 0.12)` + lift `translateY(-2px)`.\
\
### Sfondo (componente `<GrainMesh />`)\
\
Sempre visibile dietro tutto. Implementazione:\
- Gradient mesh CSS con 3-4 radial-gradient sovrapposti (`--color-bg-warm`, `--color-bg-deep`, `--color-bg-accent`).\
- **Grain SVG noise filter** sopra: `<svg><filter><feTurbulence baseFrequency="0.85" numOctaves="2" /></filter></svg>` con opacity 0.35-0.45.\
- Animazione lentissima del mesh (30s loop, scale + rotate piccolissimi). Disabilitala con `prefers-reduced-motion`.\
- Opzionale stretch goal: usa Three.js per un shader fragment noise animato al posto del mesh CSS. Se non sai come, salta e usa CSS \'97 il risultato \'e8 identico.\
\
Le card sopra il mesh hanno sfondo `--color-surface` con grain texture meno intensa (opacity 0.15) per mantenere coerenza.\
\
## PRIMITIVE DA COSTRUIRE PRIMA (file in `src/components/primitives/`)\
\
1. **`<GrainMesh />`** \'97 sfondo animato globale. Usato una volta, root.\
2. **`<BentoCard size="sm|md|lg|xl|hero" />`** \'97 wrapper card con padding, radius, shadow, grain interno. Ha props `title`, `eyebrow` (label sopra titolo, uppercase 11px), `action` (slot top-right per bottoni).\
3. **`<ProgressRing value=\{0-100\} size=\{number\} thickness=\{number\} gradient />`** \'97 anello stile Apple Fitness. Stroke spesso (12-16px), gradient lineare dai token (magenta\uc0\u8594 flame, oppure teal\u8594 success). Animazione fluida quando `value` cambia.\
4. **`<StatNumber value size="sm|md|lg|xl" unit suffix />`** \'97 numero gigante in Instrument Serif con unit pi\'f9 piccola in Inter. Animazione count-up al mount (max 800ms, easing easeOutCubic).\
5. **`<StreakCounter days />`** \'97 numero giorni + label "giorni di fila". Icona fiamma SVG custom (no emoji). Colore intensifica dopo 7, 14, 30 giorni.\
6. **`<ChipTag tone="neutral|success|warning|magenta|teal" />`** \'97 tag pill per tag journal, generi libri/film, status. Tipografia 12px medium uppercase letter-spacing 0.05em.\
7. **`<SectionTitle eyebrow title />`** \'97 titolo sezione con piccola label colorata sopra (eyebrow). Stile editoriale Notion-like.\
8. **`<EmptyState illustration title cta />`** \'97 quando una sezione \'e8 vuota, niente "no data" triste. Messaggio caldo + CTA per inserire prima entry.\
\
## LAYOUT BENTO (file `src/tabs/CorpoMente/layout.tsx`)\
\
Griglia: 12 colonne desktop, gap 16px, max-width 1280px centrato. Su mobile (\uc0\u8804 768px): colonna unica, gap 12px.\
\
### HERO (full-width, sempre in cima)\
- **Sinistra (col-span-7):** card "Stato Obiettivo Corpo & Mente" con il punteggio 1-10 GIGANTE in Instrument Serif (es. `6` alto 200px). A fianco mini-trend ultime 4 settimane (sparkline Recharts). Sotto: ultimo testo di riflessione (eccerto 2 righe + "Leggi tutto").\
- **Destra (col-span-5):** card "Insight Settimanali". Lista compatta di 3-4 insight generati (placeholder ora, AI dopo). Ognuno con icona piccola, una frase, micro-tag colorato.\
- Hero card: padding 32px, radius 32px, gerarchia tipografica forte.\
\
### BENTO SOTTO (12 colonne, righe altezza variabile)\
\
Disposizione consigliata (Claude Code, sentiti libero di affinare ma rispetta le size-class):\
\
| Modulo | Desktop | Mobile |\
|---|---|---|\
| **Peso & misure** (chart Recharts area + ultimo peso + delta vs settimana scorsa) | col-span-6 row-span-2 | full |\
| **Streak Rucking** (Strava \uc0\u8594  ProgressRing settimanale + StreakCounter + km totali settimana) | col-span-3 row-span-1 | full |\
| **Nutrizione oggi** (kcal del giorno vs TDEE + macro bar mini) | col-span-3 row-span-1 | full |\
| **Obiettivi settimanali** (checkbox progress + ring completamento) | col-span-3 row-span-1 | full |\
| **Sonno** (placeholder se non c'\'e8 dato \'97 EmptyState con CTA) | col-span-3 row-span-1 | full |\
| **Libri in corso** (cover libro reading + % avanzamento + prossima azione) | col-span-4 row-span-2 | full |\
| **Film recenti** (poster ultimi 3 visti, swipe orizzontale) | col-span-4 row-span-2 | full |\
| **Journal recenti** (ultimi 4 entry compatti, tap per espandere, tag colorati) | col-span-4 row-span-2 | full |\
| **Foto progressi** (timeline thumbnail + CTA "Nuova sessione") | col-span-6 row-span-1 | full |\
| **Misure corpo** (vita, fianchi, peso ultimi valori + delta) | col-span-6 row-span-1 | full |\
\
Ogni modulo \'e8 un **componente isolato** in `src/tabs/CorpoMente/modules/`. Esempi: `WeightModule.tsx`, `StravaStreakModule.tsx`, `NutritionTodayModule.tsx`, `BooksModule.tsx`, `FilmsModule.tsx`, `JournalModule.tsx`, ecc.\
\
## REGOLE PER OGNI MODULO\
\
1. **Una metrica protagonista per card.** Non 5 numeri uguali. Uno grande, gli altri di supporto.\
2. **Un'azione sempre visibile.** "Aggiungi entry", "Vedi tutti", "Modifica" \'97 mai card morte.\
3. **Stato vuoto curato.** Mai "no data". Sempre `<EmptyState />` con messaggio caldo italiano.\
4. **Click sulla card \uc0\u8594  modal/drawer** con tutti i dati storici di quella sezione (per non perdere nessun dato attuale). Drawer da destra su desktop, fullscreen su mobile.\
5. **Loading state**: skeleton con grain animato (no spinner generici).\
\
## MICRO-INTERAZIONI\
\
- Hover card: lift 2px + ombra pi\'f9 morbida, transizione 200ms ease-out.\
- Tap card mobile: scale(0.98) per 100ms, feedback tattile.\
- Numeri: count-up animato al mount.\
- ProgressRing: si riempie con animazione 600ms ease-out al cambio valore.\
- Toggle obiettivo settimanale: ring si riempie + micro-haptic visivo (pulse leggero), zero confetti.\
- Streak: quando si supera milestone (7, 14, 30, 100), pulse del numero e tinta che vira al `--color-flame`. Niente popup.\
\
## RESPONSIVE / MOBILE\
\
- Breakpoint: 1024px (laptop), 768px (tablet), 480px (mobile).\
- Bento collassa cos\'ec: 12-col \uc0\u8594  6-col \u8594  1-col.\
- Hero: su mobile diventa stack verticale (score sopra, insight sotto).\
- Tap target minimo 44x44px.\
- Font display si scala (clamp): hero score `clamp(120px, 18vw, 200px)`.\
- Modal/drawer su mobile sempre fullscreen, mai bottom-sheet a met\'e0.\
\
## ORDINE DI BUILD (rispettalo)\
\
1. Crea `tokens.css` + `<GrainMesh />` + setup font Google.\
2. Crea le 8 primitive (`BentoCard`, `ProgressRing`, ecc.) con Storybook-like demo page se vuoi (`src/design/showcase.tsx`).\
3. Costruisci la sezione Hero (Score + Insights) e fai vedere il risultato.\
4. Costruisci la shell bento vuota (placeholder colorati nelle posizioni giuste).\
5. Un modulo per volta, in quest'ordine: Peso \uc0\u8594  Strava \u8594  Nutrizione \u8594  Obiettivi settimanali \u8594  Libri \u8594  Journal \u8594  Film \u8594  Foto \u8594  Misure \u8594  Sonno (empty).\
6. Ogni modulo: prima la card riassuntiva, poi il drawer/modal con dati completi.\
7. Polish finale: animazioni, micro-interazioni, accessibilit\'e0 (aria-label, focus visibili, prefers-reduced-motion).\
\
## COSA FARE SE QUALCOSA NON \'c8 CHIARO\
\
Fermati e chiedi prima di inventare. Se trovi una sezione del JSON che non ho mappato qui, chiedimi dove va. Se uno schema Firebase blocca un'idea visiva, dillo prima di romperlo.\
\
## DELIVERABLE\
\
- Tutti i file nuovi sotto `src/design/`, `src/components/primitives/`, `src/tabs/CorpoMente/modules/`.\
- Aggiorna l'entry esistente della tab "Corpo & Mente" per usare il nuovo layout.\
- Commit atomici: uno per design system, uno per hero, uno per shell bento, uno per modulo.\
- README breve in `src/tabs/CorpoMente/README.md` che spiega l'architettura.\
\
Inizia. Prima cosa: tokens + GrainMesh + setup font. Mostrami il risultato e aspetta conferma prima di andare avanti.}