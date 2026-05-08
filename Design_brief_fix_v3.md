{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 # WIDGETS V4 \'97 Densit\'e0 + identit\'e0 cromatica per dominio\
\
## CONTESTO\
Bento grid funziona, swap iPhone-style funziona, drawer funzionano. Ora si lavora **dentro** ogni card. Le card attuali sono troppo vuote: spazio sprecato, gerarchia debole, niente identit\'e0 cromatica per dominio, basso valore informativo a colpo d'occhio.\
\
## OBIETTIVO\
Trasformare ogni widget da "contenitore in attesa" a **mini-dashboard editoriale**. Pattern: una metrica protagonista, una micro-narrazione, un sub-set di dati di contesto, un'azione chiara. Stile Whoop/Oura/Linear, non Bootstrap dashboard.\
\
## VINCOLI ASSOLUTI\
- Non toccare BentoGrid, drag&drop, swap, drawer.\
- Non toccare le size class S/M/L n\'e9 la grid CSS.\
- Riusa primitive esistenti (BentoCard, ProgressRing, StatNumber, StreakCounter, ChipTag).\
- Non aggiungere librerie nuove.\
- I dati arrivano dal Firebase esistente. Se un dato non esiste, mostra un piccolo placeholder elegante, non un errore.\
\
## DESIGN SYSTEM AGGIUNTIVO\
\
### Color tokens per dominio\
Aggiungi a `tokens.css` (se non gi\'e0 presenti):\
```css\
--accent-fitness: var(--color-teal);     /* Rucking, Peso, Misure, Foto */\
--accent-nutrition: var(--color-flame);  /* Nutrizione */\
--accent-mind: var(--color-magenta);     /* Journal, Libri */\
--accent-cinema: #C73E5C;                /* Film (rosso desaturato) */\
--accent-rest: #6B5DD3;                  /* Sonno (viola tenue) */\
--accent-goal: var(--color-success);     /* Obiettivi settimanali */\
```\
\
### Eyebrow colorato per dominio\
Aggiorna `<SectionTitle eyebrow>` (o crea variante `<DomainEyebrow domain="fitness|nutrition|mind|cinema|rest|goal" />`):\
- Eyebrow \'e8 uppercase 11px, letter-spacing 0.08em, peso 600.\
- Davanti all'eyebrow c'\'e8 un **dot 6px circolare** del colore-firma del dominio.\
- Il testo dell'eyebrow rimane `--color-ink-muted` (NON colorato): il dot fa il lavoro.\
- Esempio: `\uc0\u9679  RUCKING` dove il dot \'e8 teal.\
- Su mobile il dot rimane uguale.\
\
### Mini-icone per dominio (set unificato)\
Crea/usa un set di 10 icone SVG monochrome 16\'d716 o 20\'d720, stile lineare 1.5px stroke, color `currentColor`. Una per widget. Stile inspired by Lucide/Phosphor. Se usi gi\'e0 `lucide-react` riusalo, altrimenti SVG inline.\
- Rucking: footprints / mountain\
- Peso: scale (bilancia)\
- Misure: ruler\
- Foto progressi: image-frame\
- Nutrizione: leaf / apple\
- Sonno: moon-stars\
- Obiettivi: target / check-circle\
- Libri: book-open\
- Film: film / clapperboard\
- Journal: feather / pen-tool\
\
### Sparkline component (riusabile, non c'\'e8 ancora)\
Crea `<Sparkline data=\{number[]\} accent=\{CSSVar\} variant="line|area|bars" height=\{32\} />`:\
- Wrapper Recharts molto piccolo, niente assi, niente legend, niente tooltip.\
- Linea/area con `stroke=\{accent\}`, gradient opacity 0.25 \uc0\u8594  0.05 se variant area.\
- Padding zero. Si comporta come grafico inline.\
- Usato dentro le card per sostituire i grossi spazi vuoti attuali.\
\
### Mini-stat row (riusabile)\
`<MiniStatRow stats=\{[\{label, value, unit, delta?\}]\} />`:\
- Riga orizzontale di 2-4 stat compatte.\
- Ogni stat: label uppercase 10px sopra, valore 16px peso 600 con tabular-nums, unit pi\'f9 piccola, delta opzionale colorato (verde/rosso) accanto.\
- Separatore verticale sottile `1px solid var(--color-line)` tra le stat.\
\
### Trend pill\
`<TrendPill direction="up|down|flat" tone="positive|negative|neutral" />`:\
- Pill compatta 22px h, padding 4px 8px, radius 999px.\
- Icona freccia + valore numerico.\
- Colore: positive=success, negative=flame, neutral=ink-muted (background tenue del colore).\
\
---\
\
## SPECIFICHE WIDGET PER WIDGET\
\
Per ogni widget, riempire le tre size class (S/M/L) con contenuti scalati. La logica generale:\
- **S** = una metrica protagonista + una info di contesto\
- **M** = metrica protagonista + 2-3 metriche secondarie + una mini-viz\
- **L** = tutto di M + viz pi\'f9 ricca + 1-2 dati narrativi (es. "miglior settimana", "media 30gg")\
\
### 1. RUCKING \'97 STRAVA (dominio: fitness)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  RUCKING` (teal dot)\
- ProgressRing 56px con valore settimana (4/6) al centro\
- A destra: numero grande "4/6" + label "sessioni" + StreakCounter "3 giorni"\
- In fondo riga compatta: "33 km \'b7 67%"\
\
**M (6\'d72):**\
- Header con eyebrow + icona footprints\
- ProgressRing 80px a sinistra (4/6 sessioni)\
- A destra: stat principale "33.0 km" + delta vs settimana scorsa "+4.2 km"\
- Sotto: Sparkline area ultimi 7 giorni di km giornalieri (accent teal)\
- Footer: 3 mini-stat ["Streak: 3gg", "Media: 9.8 km", "Peso zaino: 10kg"]\
\
**L (6\'d73):**\
- Tutto come M +\
- Heatmap calendar 7 colonne \'d7 4 settimane (28 quadratini): giorni con rucking colorati teal scaling per intensit\'e0 (km), giorni vuoti grigio-bordo. Tipo GitHub contributions in miniatura.\
- Statistica narrativa: "Settimana migliore: 47 km \'b7 5 sessioni" oppure "Hai camminato per 4h 23m questa settimana"\
\
**Tutti i size:** Bottone testuale in alto a destra "Dettagli" \uc0\u8594  apre drawer Rucking.\
\
---\
\
### 2. PESO CORPOREO (dominio: fitness)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  PESO`\
- "78.1 kg" grande (Instrument Serif 36px)\
- TrendPill "\uc0\u8595  -0.3 kg" sotto\
\
**M (6\'d72):**\
- Header eyebrow + icona scale\
- "78.1 kg" gigante (48px serif) + unit "kg" piccola + TrendPill "\uc0\u8595  -0.3 kg" accanto\
- Sotto al numero: "29 apr \'b7 3 rilevazioni"\
- Sparkline area ultimi 14 giorni (accent teal, area gradient)\
- Footer: mini-stat ["7 giorni: -0.4kg", "30 giorni: -1.4kg", "Target: 75kg"] con micro-progress verso target\
\
**L (6\'d73):**\
- Tutto di M +\
- Chart area 90 giorni pi\'f9 alto e leggibile, con asse Y light a sinistra\
- Linea orizzontale tratteggiata al target (75kg) con label "Target" piccola\
- Statistica narrativa: "Sei al 38% del percorso verso il target. Continua cos\'ec." (calcolata dinamicamente)\
- Foto progressi mini-thumb (1 quadrato 48px) ultima sessione con label "Ultima foto: 23 apr"\
\
**Tutti i size:** "Storico" / "Aggiungi" in alto a destra.\
\
---\
\
### 3. NUTRIZIONE OGGI (dominio: nutrition)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  NUTRIZIONE` (flame dot)\
- "684 kcal" grande\
- ProgressBar sottile sotto (% del TDEE 1213)\
\
**M (6\'d72):**\
- Header eyebrow + icona leaf\
- "684 / 1213 kcal" \'97 ratio grande, con dot indicator a met\'e0 bar\
- ProgressBar orizzontale spessa 12px, gradient flame\
- Riga 3 macros: P 58g \'b7 C 1g \'b7 F 54g, ognuno con mini progress dot e label\
- "3 pasti registrati oggi" small grey\
\
**L (6\'d73):**\
- Tutto di M +\
- 3 piccoli stacked bar per giorno ultimi 7 giorni (Recharts, mini, P/C/F stacked, accent flame)\
- Stat narrativa: "Media settimana: 1240 kcal \'b7 102% TDEE" oppure "Pi\'f9 alto in proteine marted\'ec"\
- Lista compatta ultimi 3 voci pasti del giorno (icona + descrizione breve + kcal)\
\
**Tutti i size:** "Log" / "Aggiungi pasto" in alto a destra.\
\
---\
\
### 4. OBIETTIVI SETTIMANALI (dominio: goal)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  OBIETTIVI` (success dot)\
- ProgressRing piccolo 56px con "0/1" al centro\
- Label "0% settimana"\
\
**M (6\'d72):**\
- Header eyebrow + icona target\
- ProgressRing 80px a sinistra (% completati)\
- Lista checkbox compatta a destra: ogni obiettivo \'e8 una riga con checkbox custom, testo small, e timer pill se ha scadenza\
- Bottone ghost "+ Obiettivo" in fondo\
\
**L (6\'d73):**\
- Tutto di M +\
- Storico ultime 8 settimane: row di pillole 1\'d7, ogni pillola = 1 settimana, colorata in base al success rate (vuota \uc0\u8594  success-light \u8594  success)\
- Stat narrativa: "Hai completato il 60% nelle ultime 4 settimane" oppure "Migliore settimana: 100% (15-22 apr)"\
\
**Tutti i size:** "Modifica" in alto a destra.\
\
---\
\
### 5. SONNO (dominio: rest, placeholder)\
\
**S/M/L:** EmptyState con illustrazione SVG luna+stelle (estetica grain, accent rest viola), titolo "Tracking sonno non attivo", sottotitolo "Importa da Apple Health", CTA pieno "Importa Health".\
\
Quando il dato sar\'e0 disponibile, replicare pattern simile a Peso (numero protagonista = ore dormite, sparkline 14gg, mini-stat ["Media settimana", "Variabilit\'e0", "Bedtime medio"]).\
\
---\
\
### 6. BOOK TRACKER (dominio: mind)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  LIBRI` (magenta dot)\
- Cover libro corrente miniatura 48\'d772px\
- Titolo + autore tronco una riga\
- ChipTag "IN CORSO"\
\
**M (6\'d72):**\
- Header eyebrow + icona book-open\
- Layout: cover 80\'d7120 a sinistra, contenuto a destra\
  - "Vagabonding" titolo 18px peso 600\
  - "Rolf Potts" autore 13px muted\
  - Progress bar lettura 64/208 pagine con % accanto\
  - 2 mini-stat ["3/1 letti quest'anno", "3 in coda"]\
- ChipTag "IN CORSO" in alto a destra del titolo\
\
**L (6\'d73):**\
- Tutto di M +\
- Sotto: shelf orizzontale con 4-6 cover dei libri "Da leggere" (50\'d775 ognuna), scrollabile\
- Stat narrativa: "Hai letto 432 pagine quest'anno" oppure "Stai leggendo da 8 giorni"\
- Quote tile (se l'utente ha salvato una quote del libro corrente): card secondaria piccola con citazione in italics, max 2 righe.\
\
**Tutti i size:** "Libreria" in alto a destra.\
\
---\
\
### 7. FILM TRACKER (dominio: cinema)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  CINEMA` (cinema dot)\
- Poster ultimo film visto (full bleed nella card, leggermente sfumato in basso)\
- Titolo film overlay in basso "Furiosa" + rating stelline\
\
**M (6\'d72):**\
- Header eyebrow + icona clapperboard\
- 3 poster orizzontali 88\'d7132 ultimi visti, gap 8px, leggera rotazione fan-out (-2\'b0, 0\'b0, +2\'b0 per dare profondit\'e0)\
- Sotto: "Ultimo: Furiosa \'97 30 apr" + mood ChipTag\
- Footer 2 mini-stat ["8/8 visti", "8 watchlist"]\
\
**L (6\'d73):**\
- Tutto di M +\
- Riga "Watchlist" sotto: 4 poster 64\'d796 da vedere\
- Stat narrativa: "Genere preferito quest'anno: Crime" oppure "Regista pi\'f9 visto: Park Chan-wook (3)"\
- ChipTag mood per ogni poster ultimo visto (es. "ispirato", "malinconico")\
\
**Tutti i size:** "Tutti" in alto a destra.\
\
---\
\
### 8. DAILY JOURNAL (dominio: mind)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  JOURNAL` (magenta dot)\
- "6 entries" numero grande\
- Tag prevalente "PAURA" pillola\
\
**M (6\'d72):**\
- Header eyebrow + icona feather\
- Stat hero "6 entries questa settimana" + tag dominante\
- Lista 3 entries pi\'f9 recenti, ognuna:\
  - Data piccola (29 apr)\
  - Excerpt 2 righe troncato\
  - Tag colorati pillole piccole\
- Border-left 2px del colore del tag dominante della entry (sottile accent magenta o altro)\
\
**L (6\'d73):**\
- Tutto di M +\
- Sotto la lista: tag cloud piccolo dei 5 tag pi\'f9 usati nelle ultime 4 settimane, dimensione font scala con frequenza\
- Stat narrativa: "Il tag 'lavoro' compare nel 78% delle entries" oppure "Hai scritto in 5 dei 7 giorni"\
- Bottone composer rapido in fondo "+ Scrivi una nota" inline\
\
**Tutti i size:** "Scrivi" in alto a destra.\
\
---\
\
### 9. FOTO PROGRESSI (dominio: fitness)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  FOTO`\
- "1 sessione" numero\
- "23 apr 26" data ultima\
\
**M (6\'d72):**\
- Header eyebrow + icona image-frame\
- Layout: ultima sessione thumbs grandi 100\'d7150 (front+side affiancate), gap 8px\
- Sotto: data + stat "1 sessione totale"\
- Bottone CTA "+ Nuova sessione" pieno teal piccolo\
\
**L (6\'d73):**\
- Tutto di M +\
- Timeline orizzontale di tutte le sessioni: pillole verticali 60\'d790 ognuna con thumb front, scrollabile\
- Slider before/after (if 2+ sessions): seleziona due sessioni, mostra confronto immagini con divisore trascinabile\
- Stat narrativa: "Prima sessione: X data \'b7 Sei avanti di N giorni dal target"\
\
**Tutti i size:** "+ Nuova sessione" CTA visibile sempre.\
\
---\
\
### 10. MISURE CORPO (dominio: fitness)\
\
**S (3\'d71):**\
- Eyebrow `\uc0\u9679  MISURE`\
- 3 numeri compatti in riga ["78", "85", "95"] con sotto labels piccolissime ["KG", "VITA", "FIANCHI"]\
\
**M (6\'d72):**\
- Header eyebrow + icona ruler\
- Layout 3 colonne: ogni colonna \'e8 una misura\
  - Numero grande 32px Instrument Serif\
  - Label 10px uppercase\
  - TrendPill mini con delta vs misurazione precedente\
  - Sparkline 24px h sotto, accent teal\
- 3 colonne: Peso \'b7 Vita \'b7 Fianchi\
\
**L (6\'d73):**\
- Tutto di M +\
- Aggiungi 4\'b0 colonna "BMI" calcolato dinamicamente\
- Sotto: chart unificato con tre linee (peso, vita, fianchi) ultimi 30 giorni, asse Y normalizzato (% delta dal valore iniziale)\
- Stat narrativa: "Il rapporto vita/fianchi \'e8 0.89 (sano)" oppure "Hai perso 2cm di vita in 6 settimane"\
\
**Tutti i size:** "Aggiorna" in alto a destra.\
\
---\
\
## REGOLE TRASVERSALI\
\
### Spazio interno card\
- Padding interno: 20px desktop, 16px mobile.\
- Header (eyebrow + azione) sticky in cima, mai cresce con contenuto.\
- Tra header e content: gap 12px.\
- Tra content e footer: gap 8px.\
- **Niente altezze fisse interne**, lascia che il contenuto riempia naturalmente la card.\
\
### Tipografia per ruoli\
- Numero protagonista: Instrument Serif 36-48px (size dependent).\
- Stat secondari: Inter 16px peso 600.\
- Label: Inter 10-11px uppercase peso 600 letter-spacing 0.08em.\
- Body text: Inter 13-14px peso 400.\
- Stat narrativa (italic-feel): Instrument Serif italic 14px peso 400 muted.\
\
### Animazioni al mount\
- Numeri: count-up animato da 0 al valore, max 800ms ease-out-cubic.\
- Sparkline: stroke-dasharray draw-in 600ms.\
- ProgressRing: fill animato 600ms.\
- Tutto rispetta `prefers-reduced-motion`.\
\
### Stati di loading\
- Skeleton con grain animato lento (2s loop), stessa shape della card finale.\
- Niente spinner.\
\
### Stati vuoti (per ogni widget)\
- Mai "no data" tristi. Sempre microcopy caldo italiano + CTA.\
- Es. Journal vuoto: "Il tuo journal ti sta aspettando. Scrivi la prima nota?" + bottone.\
- Foto progressi vuoto: "Scatta la prima foto. Ti ringrazierai tra 6 mesi." + bottone.\
\
### Densit\'e0 mobile\
- Su size S in mobile, riduci automaticamente le info al 70% (nascondi il 3\'b0 dato di contesto).\
- Mai font sotto 11px.\
- Numeri protagonisti scalano a `clamp()`: `clamp(28px, 8vw, 48px)`.\
\
---\
\
## ORDINE DI IMPLEMENTAZIONE\
\
Implementa **un widget per volta**. Per ogni widget, fai tutte e 3 le size class prima di passare al successivo. Mostra screenshot dopo ogni widget completato e aspetta conferma prima di procedere.\
\
Ordine:\
1. **Rucking** (\'e8 il pi\'f9 visivamente ricco, fa da template).\
2. **Peso** (altro hero, valida il pattern numero+sparkline+narrativa).\
3. **Nutrizione** (valida i macros + stacked bars).\
4. **Obiettivi Settimanali** (valida checkbox interattivi + storico settimane).\
5. **Libri** (valida cover + shelf orizzontale).\
6. **Film** (valida poster fan-out + watchlist).\
7. **Journal** (valida tag colorati + composer).\
8. **Misure** (valida 3-col layout con sparkline mini).\
9. **Foto Progressi** (valida timeline + before/after slider).\
10. **Sonno** (empty state + futura integrazione).\
\
---\
\
## DELIVERABLE\
\
- Nuove primitive: `<DomainEyebrow>`, `<Sparkline>`, `<MiniStatRow>`, `<TrendPill>` in `src/components/primitives/`.\
- Per ogni widget, file in `src/tabs/CorpoMente/modules/<Widget>Module.tsx` aggiornato. Ogni file esporta un componente che riceve prop `size: 'S' | 'M' | 'L'` e renderizza il layout appropriato.\
- Update `tokens.css` con nuovi accent per dominio.\
- Niente regressioni: il drag&drop, i drawer, lo swap continuano a funzionare.\
- Commit per widget, messaggi chiari: `feat(corpo-mente/rucking): rich widget with size variants`.\
\
## SE QUALCOSA NON \'c8 CHIARO\
\
Fermati e chiedi. Particolarmente:\
- Se un dato richiesto nella card non esiste nel JSON Firebase, segnala prima di procedere \'97 decideremo insieme se mostrare placeholder o se aggiungere il calcolo derivato.\
- Se la statistica narrativa \'e8 ambigua (es. "miglior settimana"), proponi 2-3 alternative e fammi scegliere.\
\
Inizia con Rucking. Mostra le 3 size class. Aspetta conferma prima di passare a Peso.}