{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;\f1\fnil\fcharset0 LucidaGrande;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # FIX V2: Tab "Corpo & Mente" \'97 Sfondo, Nav, Drag&Drop, Drawer\
\
## CONTESTO\
Il primo redesign della tab Corpo & Mente \'e8 andato bene: hero, primitive (BentoCard, ProgressRing, StatNumber, StreakCounter, ChipTag), layout bento, palette grain Suno-like.\
\
Ma ci sono 4 problemi residui da risolvere in **4 fasi sequenziali**. Non procedere alla fase successiva senza conferma esplicita dell'utente. Mostra screenshot/risultato dopo ogni fase.\
\
## STACK (invariato)\
React 19, Vite 8, Firebase 12, Recharts 3, Three.js 0.184, Anthropic SDK, Groq SDK.\
\
## VINCOLI ASSOLUTI\
- Non toccare il data layer Firebase.\
- Non rompere funzionalit\'e0 esistenti.\
- Riusa le primitive gi\'e0 create (BentoCard, ProgressRing, StatNumber, StreakCounter, ChipTag, SectionTitle, EmptyState). Non ricrearle.\
- Riusa `tokens.css` esistente. Se servono nuovi token, aggiungili l\'ec, non spargerli nei componenti.\
- Niente librerie pesanti aggiuntive. Le uniche aggiunte autorizzate in questa V2: `react-grid-layout` e `react-resizable` (peer dependency).\
\
---\
\
## FASE 1 \'97 Sfondo mesh continuo sotto al bento\
\
**Problema:** sotto l'hero, lo sfondo della griglia bento \'e8 cream piatto. Spezza la magia visiva del mesh purple/orange/cream creato sopra. Il risultato sembra "due app diverse" sopra e sotto.\
\
**Soluzione:**\
1. Estendi il `<GrainMesh />` esistente in modo che copra l'intera tab "Corpo & Mente", non solo l'area hero. Lo sfondo \'e8 uno solo, continuo, dall'header fino al fondo della pagina.\
2. Sotto le card bento il mesh \'e8 ancora visibile ma **attenuato**:\
   - Crea una variante `<GrainMesh variant="muted" />` che applica:\
     - `opacity: 0.55`\
     - `filter: blur(60px) saturate(0.85)`\
     - mantiene la grana SVG sopra a opacity 0.25 (cos\'ec non \'e8 solo una sfocatura banale)\
3. Strategia di layering:\
   - Layer 0 (base, fixed full-viewport): `<GrainMesh variant="full" />` \'97 mesh forte, animato lentissimo (30s)\
   - Layer 1 (assoluto, dietro al bento): `<GrainMesh variant="muted" />`\
   - Layer 2: le card bento con `--color-surface` semitrasparente (`background: color-mix(in srgb, var(--color-surface) 92%, transparent)`) + grana interna.\
4. **Card sopra mesh, non su piano cream.** Le card galleggiano. Aumenta leggermente la shadow per dare lift: `0 12px 48px rgba(31, 24, 18, 0.14)`.\
5. Aggiungi un sottile **scrim sfumato** in cima al bento (24px di altezza, gradient da trasparente a `rgba(31, 24, 18, 0.06)`) per dare profondit\'e0 tra hero e bento.\
\
**Stretch goal opzionale (solo se le altre fasi sono finite):**\
- Spotlight cursore: aggiungi `<CursorSpotlight />` componente che disegna un radial-gradient `rgba(255,255,255,0.08)` 320px raggio che segue il mouse. Solo desktop (`@media (hover: hover) and (pointer: fine)`). Disabilitato con `prefers-reduced-motion`.\
\
**File:**\
- Modifica: `src/components/primitives/GrainMesh.tsx`\
- Modifica: `src/tabs/CorpoMente/layout.tsx`\
- Eventuale nuovo: `src/components/primitives/CursorSpotlight.tsx`\
\
**Stop alla fine della fase. Mostra il risultato. Non procedere.**\
\
---\
\
## FASE 2 \'97 Top nav riprogettata\
\
**Problema:** la top nav (Dashboard / Corpo & Mente / Money & Lavoro / Relazioni / Libert\'e0 / Progetto Digitale / Esci) \'e8 basic: solo testo + sottolineatura teal. Non comunica "startup AI", non scala visivamente con il resto.\
\
**Soluzione (target: pill-bar elegante stile Linear/Arc, non Bootstrap tabs):**\
\
1. **Container:** una "floating nav bar" centrata orizzontalmente, sticky in alto (16px dal top), max-width contenuto (non full-width). Sfondo: `rgba(31, 24, 18, 0.6)` con `backdrop-filter: blur(24px) saturate(140%)`. Bordo `1px solid rgba(255, 255, 255, 0.08)`. Radius 999px (pill perfetta). Padding interno 6px.\
\
2. **Item:**\
   - Stato default: testo `--color-ink-on-dark` (aggiungi al token: `#E8DFCF`), peso 500, 13px, uppercase, letter-spacing 0.06em. Padding 10px 18px. Radius 999px.\
   - Hover: background `rgba(255, 255, 255, 0.06)`. Transizione 180ms.\
   - Active: background pill colorata che cambia tinta in base al goal (ogni macro-obiettivo ha un suo colore-firma):\
     - Dashboard: `--color-ink-muted` (neutro)\
     - **Corpo & Mente: `--color-teal`**\
     - **Money & Lavoro: `--color-flame`**\
     - **Relazioni: `--color-magenta`**\
     - **Libert\'e0: viola** (aggiungi token `--color-violet: #9B5CD9`)\
     - **Progetto Digitale: giallo acido** (aggiungi token `--color-acid: #D4E04A`)\
   - Active: pill background = colore-firma a opacity 0.18, testo = colore-firma a opacity 1, **piccolo dot 6px del colore-firma** a sinistra del testo.\
   - Indicator animato: la pill colorata "scorre" con animazione spring (framer-motion non richiesto \'97 usa CSS transition su `transform: translateX()` con un layout shared element pattern, oppure semplicemente transizione background-color).\
\
3. **"Esci"** \'e8 separato dagli altri: a destra, fuori dalla pill bar, come bottone ghost piccolo con icona logout. Non fa parte del flusso "scegli obiettivo". \'c8 un'azione amministrativa.\
\
4. **Mobile (\uc0\u8804 768px):** la pill bar diventa scrollabile orizzontalmente (`overflow-x: auto`, `scroll-snap-type: x mandatory`, `scrollbar-width: none`). L'item attivo si auto-centra al cambio. Niente hamburger menu \'97 preferisco lo scroll orizzontale per coerenza con l'estetica startup.\
\
5. **Bonus identitario:** ogni macro-obiettivo ha gi\'e0 il suo colore-firma. Quando si attiva una tab, **anche l'accent del mesh dietro vira leggermente verso quel colore** (sostituisci uno dei 3 radial-gradient del GrainMesh con il colore-firma della tab attiva, transizione 800ms ease-out). Risultato: cambiare tab cambia "stagione" all'app. \'c8 sottile ma fortissimo.\
\
**File:**\
- Nuovo: `src/components/navigation/TopNav.tsx`\
- Nuovo: `src/components/navigation/TopNav.module.css`\
- Aggiorna: `tokens.css` (aggiungi `--color-violet`, `--color-acid`, `--color-ink-on-dark`)\
- Aggiorna: il componente di routing/layout principale per sostituire la nav esistente\
- Aggiorna: `<GrainMesh />` per accettare prop `accentColor` e virare uno dei gradient\
\
**Stop alla fine della fase. Mostra il risultato. Non procedere.**\
\
---\
\
## FASE 3 \'97 Drag & drop widget stile iPhone (con react-grid-layout)\
\
**Problema:** il drag custom attuale crea spazi vuoti, perde lo stato, \'e8 fragile.\
\
**Soluzione: usa `react-grid-layout`. \'c8 lo standard di settore per dashboard widget (Grafana, dashboard cloud, ecc.). Risolve magnetizzazione, compattazione, persistenza, resize, in modo nativo.**\
\
1. **Setup:**\
```bash\
   npm install react-grid-layout\
   npm install -D @types/react-grid-layout\
```\
   Importa CSS base: `react-grid-layout/css/styles.css` e `react-resizable/css/styles.css`. **Sovrascrivili pesantemente** con il nostro design (vedi sotto), perch\'e9 di default sono brutti.\
\
2. **Configurazione griglia:**\
   - Cols breakpoints: `\{ lg: 12, md: 12, sm: 8, xs: 4, xxs: 2 \}`\
   - rowHeight: `120px` (questa \'e8 la misura base di una "size 1\'d71")\
   - margin: `[16, 16]` (gap tra widget, sia x che y)\
   - containerPadding: `[0, 0]` (il padding lo gestisce il layout esterno)\
   - **Importante:** `compactType="vertical"` e `preventCollision=\{false\}` 
\f1 \uc0\u8594 
\f0  niente buchi, le card si compattano automaticamente come widget iPhone.\
   - `useCSSTransforms=\{true\}` per performance.\
\
3. **Size class predefinite** (l'utente non scala arbitrariamente, sceglie tra preset stile iPhone):\
   - `S` = 3 col \'d7 1 row (small square)\
   - `M` = 6 col \'d7 1 row (medium wide)\
   - `L` = 6 col \'d7 2 row (large)\
   - `XL` = 12 col \'d7 2 row (full width)\
   Per ogni widget definisci `minW`, `maxW`, `minH`, `maxH` in modo che non possa essere ridimensionato fuori da queste 4 classi. Esempio: il widget Peso pu\'f2 essere `M` o `L` ma non `S`. Il widget Streak pu\'f2 essere solo `S` o `M`.\
\
4. **Modalit\'e0 "Modifica layout" esplicita:**\
   - Bottone in alto a destra del bento: `<EditLayoutButton />`. Stati: "Modifica layout" 
\f1 \uc0\u8594 
\f0  "Fatto".\
   - Click 
\f1 \uc0\u8594 
\f0  toggle stato `isEditMode` (Context o Zustand).\
   - In modalit\'e0 normale: `react-grid-layout` riceve `isDraggable=\{false\}` e `isResizable=\{false\}`. Le card sono statiche, click apre il drawer.\
   - In modalit\'e0 edit:\
     - `isDraggable=\{true\}` e `isResizable=\{true\}` (solo handle in basso a destra, custom).\
     - Tutte le card ricevono una classe CSS `.is-wiggling` con animazione keyframe:\
```css\
       @keyframes wiggle \{\
         0%, 100% \{ transform: rotate(-0.4deg); \}\
         50% \{ transform: rotate(0.4deg); \}\
       \}\
       .is-wiggling \{ animation: wiggle 0.18s ease-in-out infinite; \}\
```\
     - `prefers-reduced-motion`: il wiggle si disabilita, ma viene aggiunto un bordo tratteggiato `2px dashed --color-magenta` sulle card per indicare che sono spostabili.\
     - Compaiono piccoli **handle 24\'d724px in alto a sinistra** (icona "drag dots") e **in basso a destra** (icona "resize") solo in edit mode.\
     - Il click sulla card NON apre il drawer in edit mode (l'azione click \'e8 disabilitata).\
   - Bottone "Fatto" 
\f1 \uc0\u8594 
\f0  salva il `layouts` corrente su Firebase nel doc `users/\{uid\}/preferences/corpoMenteLayout` con shape `\{ lg: [...], md: [...], ... \}`. Mostra toast minimal "Layout salvato".\
   - Esiste un secondario "Ripristina layout default" che rimette a posto.\
\
5. **Persistenza:**\
   - Al mount: leggi `corpoMenteLayout` da Firebase. Se assente, usa `defaultLayout` definito nel codice.\
   - Salvataggio: solo al click "Fatto", non a ogni drag (per non saturare Firebase).\
   - Ogni widget ha `i` (id stringa) stabile, mai random.\
\
6. **Stile widget react-grid-layout (sovrascrittura CSS):**\
```css\
   .react-grid-item \{\
     transition: transform 200ms ease, box-shadow 200ms ease;\
   \}\
   .react-grid-item.react-draggable-dragging \{\
     transition: none;\
     z-index: 100;\
     transform: scale(1.04) !important;\
     box-shadow: 0 24px 64px rgba(31, 24, 18, 0.24);\
   \}\
   .react-grid-item.react-grid-placeholder \{\
     background: color-mix(in srgb, var(--color-teal) 20%, transparent);\
     border: 2px dashed var(--color-teal);\
     border-radius: 24px;\
     opacity: 1;\
   \}\
   .react-resizable-handle \{\
     /* nasconde la maniglia di default, useremo handle custom */\
     display: none;\
   \}\
   .is-edit-mode .react-resizable-handle-custom \{\
     display: block;\
   \}\
```\
\
7. **Mobile:** drag & drop **disabilitato** completamente sotto 768px. Su mobile c'\'e8 una vista dedicata "Personalizza ordine widget" raggiungibile da un menu, con una **lista verticale ordinabile** (pu\'f2 usare `react-grid-layout` con `cols=4` e `isResizable=\{false\}`). Ridimensionamento solo da desktop.\
\
**File:**\
- Nuovo: `src/tabs/CorpoMente/BentoGrid.tsx` (nuova implementazione che sostituisce il bento custom attuale)\
- Nuovo: `src/tabs/CorpoMente/EditLayoutButton.tsx`\
- Nuovo: `src/tabs/CorpoMente/defaultLayout.ts` (configurazione default size + posizioni)\
- Nuovo: `src/tabs/CorpoMente/layoutPersistence.ts` (load/save da Firebase)\
- Nuovo: `src/tabs/CorpoMente/BentoGrid.module.css` (override react-grid-layout)\
- Aggiorna: `src/contexts/EditModeContext.tsx` (Context per `isEditMode`)\
\
**Stop alla fine della fase. Mostra il risultato. Non procedere.**\
\
---\
\
## FASE 4 \'97 Drawer/Modal di dettaglio ridisegnati\
\
**Problema:** quando l'utente clicca su una card (es. "Rucking \'97 Strava") si apre un popup gigante con stile vecchio: tabella piatta, font sbagliati, colori non aggiornati.\
\
**Soluzione: ogni drawer \'e8 una "mini-pagina dedicata", non un popup.**\
\
1. **Architettura:**\
   - Componente unificato `<DetailDrawer />` che usa il pattern slot:\
```tsx\
     <DetailDrawer\
       isOpen=\{...\}\
       onClose=\{...\}\
       eyebrow="CORPO & MENTE"\
       title="Rucking \'97 Strava"\
       headerStats=\{[\
         \{ label: "Attivit\'e0", value: "10" \},\
         \{ label: "Km totali", value: "79.5" \},\
         \{ label: "Dislivello", value: "67m" \},\
         \{ label: "Zaino fisso", value: "10kg" \}\
       ]\}\
       primaryAction=\{\{ label: "Sincronizza Strava", onClick: ... \}\}\
       secondaryAction=\{\{ label: "Disconnetti", onClick: ... \}\}\
     >\
       \{/* contenuto specifico del modulo */\}\
     </DetailDrawer>\
```\
\
2. **Struttura visiva del drawer:**\
   - **Desktop (\uc0\u8805 768px):** drawer da destra, larghezza `min(720px, 90vw)`, altezza 100vh, sfondo `--color-surface` con grana, slide-in 280ms ease-out, overlay scuro `rgba(31, 24, 18, 0.5)` con backdrop-blur 8px.\
   - **Mobile (<768px):** fullscreen, slide-up 240ms ease-out, no overlay.\
\
3. **Anatomia interna del drawer (top 
\f1 \uc0\u8594 
\f0  bottom):**\
   - **Header sticky:** chiusura X a sinistra, eyebrow uppercase 11px sopra il titolo, titolo Instrument Serif 32px, padding 24px.\
   - **Stats hero row:** 2-4 stat protagoniste, layout flex con gap 24px. Ognuna: label uppercase 11px sopra, valore 36px in `JetBrains Mono` o Instrument Serif a seconda del tipo (numero precise 
\f1 \uc0\u8594 
\f0  mono; numero "soft" 
\f1 \uc0\u8594 
\f0  serif).\
   - **Action bar:** primaryAction = bottone pieno colore-firma del goal corrente (es. teal per Corpo & Mente), secondaryAction = bottone ghost.\
   - **Content area:** \'e8 qui che ogni modulo mette le sue viz contestuali.\
   - **Tabella dati grezzi in fondo:** sempre presente, sempre comprimibile (default: chiusa con accordion "Mostra tutti i dati"). Stile tabella: zebra rows con `--color-surface-alt`, header sticky, padding 12px, font 13px, primo column con tabular-nums.\
\
4. **Per ogni modulo, contenuto specifico del drawer:**\
\
   - **Peso & Misure 
\f1 \uc0\u8594 
\f0  drawer "Peso Corporeo"**:\
     - Stats hero: peso ultimo, delta vs settimana, delta vs mese, BMI calcolato.\
     - Viz: chart Recharts area linea peso ultimi 90 giorni. Toggle 7d / 30d / 90d / All.\
     - Sotto: confronto fianchi/vita stesso chart, sovrapposto con asse Y secondario.\
     - Tabella: storico completo con colonne data/peso/delta.\
\
   - **Rucking \'97 Strava 
\f1 \uc0\u8594 
\f0  drawer "Rucking"**:\
     - Stats hero come ora (Attivit\'e0 10, Km 79.5, Dislivello 67m, Zaino 10kg) ma stilati nuovi.\
     - Viz: bar chart Recharts km/giorno ultimi 30 giorni con colore-firma teal.\
     - Calendar heatmap (7\'d7~13 settimane) tipo GitHub contributions per vedere costanza. Verde scuro = giorni con rucking, vuoto = no.\
     - Tabella attivit\'e0 dettagliata sotto.\
\
   - **Nutrizione Oggi 
\f1 \uc0\u8594 
\f0  drawer "Nutrizione"**:\
     - Stats hero: kcal oggi, % vs TDEE, proteine totali, deficit/surplus settimanale.\
     - Viz: stacked bar chart per giorno (P, C, F) ultimi 14 giorni.\
     - Lista voci pasti del giorno con possibilit\'e0 edit/delete.\
\
   - **Obiettivi Settimanali 
\f1 \uc0\u8594 
\f0  drawer "Obiettivi"**:\
     - Stats hero: completati questa settimana, streak settimane consecutive con 100%, totale obiettivi attivi.\
     - Lista checkbox grandi e gestibili. Possibilit\'e0 "Aggiungi obiettivo".\
     - Storico settimane passate (success rate per settimana).\
\
   - **Sonno 
\f1 \uc0\u8594 
\f0  drawer "Sonno"** (placeholder/empty):\
     - EmptyState grande con CTA "Importa Apple Health".\
\
   - **Book Tracker 
\f1 \uc0\u8594 
\f0  drawer "Libreria"**:\
     - Stats hero: in lettura, finiti quest'anno, target anno, pagine totali.\
     - Sezioni accordion: In Lettura / Da Leggere / Finiti / Abbandonati.\
     - Click su libro 
\f1 \uc0\u8594 
\f0  sub-drawer dettagli (note, learnings, quote, application).\
\
   - **Film Tracker 
\f1 \uc0\u8594 
\f0  drawer "Cinema"**:\
     - Stats hero: visti quest'anno, target, watchlist size, regista pi\'f9 visto.\
     - Griglia poster con filtri (genere, mood, rating).\
     - Click su film 
\f1 \uc0\u8594 
\f0  sub-drawer note + citazione.\
\
   - **Daily Journal 
\f1 \uc0\u8594 
\f0  drawer "Journal"**:\
     - Stats hero: entries questa settimana, tag pi\'f9 usato, sentiment medio.\
     - Lista cronologica entries con tag colorati. Filtro per tag.\
     - Composer in fondo per nuova entry.\
\
   - **Foto Progressi 
\f1 \uc0\u8594 
\f0  drawer "Progressi"**:\
     - Stats hero: sessioni totali, ultima sessione, settimane consecutive.\
     - Grid sessioni con before/after slider per confronto due sessioni qualsiasi.\
     - Bottone "Nuova sessione".\
\
   - **Misure Corpo 
\f1 \uc0\u8594 
\f0  drawer "Misure"**:\
     - Form di update (peso, vita, fianchi, altre) con storico in tabella.\
\
5. **Accessibilit\'e0:**\
   - Focus trap nel drawer aperto.\
   - ESC chiude.\
   - `aria-modal="true"`, `aria-labelledby` punta al titolo.\
   - First focusable element = bottone close.\
   - Restore focus all'elemento che ha aperto il drawer alla chiusura.\
\
**File:**\
- Nuovo: `src/components/primitives/DetailDrawer.tsx`\
- Nuovo: `src/components/primitives/DetailDrawer.module.css`\
- Nuovo: per ogni modulo, file in `src/tabs/CorpoMente/drawers/`:\
  - `WeightDrawer.tsx`, `RuckingDrawer.tsx`, `NutritionDrawer.tsx`, `WeeklyGoalsDrawer.tsx`, `SleepDrawer.tsx`, `BooksDrawer.tsx`, `FilmsDrawer.tsx`, `JournalDrawer.tsx`, `PhotoProgressDrawer.tsx`, `BodyMeasuresDrawer.tsx`\
- Aggiorna ogni modulo del bento per aprire il rispettivo drawer al click.\
\
**Stop alla fine della fase. Mostra il risultato per almeno un drawer (es. Rucking) per allineamento visivo, poi procedi con gli altri.**\
\
---\
\
## ORDINE DI ESECUZIONE\
1. Fase 1 
\f1 \uc0\u8594 
\f0  mostra 
\f1 \uc0\u8594 
\f0  conferma utente.\
2. Fase 2 
\f1 \uc0\u8594 
\f0  mostra 
\f1 \uc0\u8594 
\f0  conferma utente.\
3. Fase 3 
\f1 \uc0\u8594 
\f0  mostra 
\f1 \uc0\u8594 
\f0  conferma utente.\
4. Fase 4 
\f1 \uc0\u8594 
\f0  mostra Rucking drawer 
\f1 \uc0\u8594 
\f0  conferma utente 
\f1 \uc0\u8594 
\f0  poi tutti gli altri drawer.\
\
## DELIVERABLE FINALE\
- Commit atomici per ogni fase (almeno 1 commit per fase, idealmente 1 per sotto-step).\
- Aggiorna `src/tabs/CorpoMente/README.md` con l'architettura nuova: BentoGrid, EditMode, Drawer pattern.\
- Niente librerie aggiunte oltre `react-grid-layout` + `@types/react-grid-layout`.\
\
## SE QUALCOSA NON \'c8 CHIARO\
Fermati. Chiedi. Non inventare. Specialmente sulla parte react-grid-layout: se la libreria non si comporta come descritto sopra, dillo prima di workaround custom.}