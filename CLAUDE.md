# Sistema Vita — Samuele Coccione
*Aggiornato al 29 aprile 2026*

Dashboard personale per il tracking di 5 obiettivi di vita.
**Utente:** Samuele Coccione, 31 anni, freelance videomaker a Milano.
**Repo:** github.com/SamueleCoccione/sistema-vita-samuele

---

## Stack

- **React 19** + **Vite 8** — build tool, no SSR
- **No TailwindCSS** — CSS custom con variabili `:root` in `src/index.css`
- **Recharts** — grafici (LineChart, BarChart)
- **Three.js** + OrbitControls — avatar 3D corporeo
- **@anthropic-ai/sdk** — chat Claude Opus con streaming (`claude-opus-4-7`, `dangerouslyAllowBrowser: true`)
- **groq-sdk** — chat alternativa (MoneyChat, LibertaChat)
- **firebase** — Realtime Database + Auth

---

## Design system

| Token | Valore | CSS var |
|-------|--------|---------|
| Sfondo | `#f5f3ef` crema caldo | `--bg` |
| Surface | `#ede9e2` | `--surface` |
| Accent | `#c8f564` lime | `--accent` |
| Navbar | `#1a1a1a` | — |
| Testo | `#1a1a1a` | `--text` |
| Testo secondario | `#7a7670` | `--text2` |
| Border | `#d4d0c8` | `--border` |

- Tipografia: **uppercase bold** per label e titoli sezione
- Grain texture: overlay fisso `.global-grain` in `App.jsx` via SVG fractalNoise, opacity 0.16
- **Nessun gradiente, nessuna shadow decorativa, nessun bordo eccessivamente arrotondato**
- Separatori: `1px solid var(--border)`

---

## CSS

Tutti i CSS sono importati esplicitamente nei componenti ma Vite li bundla globalmente — le classi `cm-*` di `CorpoMente.css` sono disponibili ovunque a runtime. **Non usare CSS modules.**

Classi utili già definite:
`cm-btn`, `cm-btn-ghost`, `cm-input`, `cm-label`, `cm-empty`,
`cm-section`, `cm-section-head`, `cm-section-title`, `cm-section-body`, `cm-icon-btn`.

---

## Persistenza

Tutto in **Firebase Realtime Database**. Path: `/utente/samuele/<key>`.

**Hook:** `useFirebaseState(key, defaultValue)` in `src/hooks/useFirebaseState.js`
— drop-in per `useState` con sync Firebase real-time.
— valori serializzati come JSON string (evita la conversione array→oggetto di Firebase).
— scrive anche in localStorage come cache sincrona.

`removeFirebaseData(key)` — per cancellazioni esplicite (logout, clear chat).

**Autenticazione:** Firebase Auth attiva. Unico utente: `samuele.coccione@gmail.com`.
Le database rules richiedono `auth != null && auth.token.email == 'samuele.coccione@gmail.com'`.

### Prefissi chiavi Firebase

| Prefisso | Tab |
|----------|-----|
| `sv_` | Corpo & Mente |
| `ml_` | Money & Lavoro |
| `rel_` | Relazioni |
| `lib_` | Libertà |
| `pd_` | Progetto Digitale |
| `dash_` | Dashboard |
| `sv_anthropic_key` | API key Anthropic (condivisa) |
| `sv_groq_key` | API key Groq (MoneyChat, LibertaChat) |

---

## Struttura tab

| Tab | Route | Stato |
|-----|-------|-------|
| Dashboard | `/` | Completa |
| Corpo & Mente | `/corpo-mente` | Completa |
| Money & Lavoro | `/money-lavoro` | Completa |
| Relazioni | `/relazioni` | Completa |
| Libertà | `/liberta` | Completa |
| Progetto Digitale | `/progetto-digitale` | Base (Stato Obiettivo attivo) |

---

## Componente condiviso: Stato Obiettivo

`src/components/ObjectiveStatus.jsx` — presente **in cima a ogni tab**.

- Barra orizzontale 1-10, colore: rosso ≤3 / giallo ≤6 / lime ≥7
- Slider + textarea → "Salva valutazione" aggiorna barra e archivio
- Archivio valutazioni collassabile, max 3 visibili + "mostra tutte"
- Ogni voce: toggle testo ▲/▼ + pulsante × elimina
- Trend LineChart lime (visibile da ≥3 valutazioni)
- Dashboard: sezione "Stato Obiettivi" con 5 barre real-time

Chiavi Firebase: `sv_obj_status`, `ml_obj_status`, `rel_obj_status`, `lib_obj_status`, `pd_obj_status`

---

## Contenuto delle tab

### 1. Dashboard (`/`)
- Header: data, saluto personalizzato, punteggio globale X/10, streak giorni consecutivi
- Sezione **Stato Obiettivi**: 5 barre orizzontali da tutti i tab, real-time
- Checklist giornaliera divisa per area (Corpo, Money, Relazioni, Libertà)
- Storico mensile collassabile con barre colorate per ogni giorno
- Chiavi: `dash_daily_v2`

### 2. Corpo & Mente (`/corpo-mente`)
- Stato Obiettivo (`sv_obj_status`)
- Insight settimana corrente (aggregato automatico)
- Obiettivi settimanali con progress bar (`sv_weekly_goals`, `sv_weekly_goals_week`)
- Strava OAuth: import automatico attività Walk/Hike (`sv_strava_activities`, `sv_strava_tokens`)
- Peso: inserimento solo lunedì + grafico trend (`sv_weight`)
- Misure corpo: altezza, peso, vita, fianchi (`sv_body_measures`)
- Foto progressi: upload frontale + laterale ogni lunedì (`sv_progressi_photos`)
- Nutrizione: voci pasto + profilo calorico (`sv_nutrition`, `sv_nutrition_profile`)
- Book Tracker: status, rating, quote, learnings, application (`sv_books_v2`, `sv_book_goal`)
- Film Tracker: OMDB API, poster automatici, rating, mood, cosa mi ha lasciato, citazione (`sv_films_v1`, `sv_film_goal`)
- Daily Journal: testo + tag emotivi, editing inline, pattern tag ultimi 30 giorni (`sv_daily_journal`)
- Consapevolezza settimanale (`sv_weekly_awareness`)
- Chat Claude (`sv_chat_cm`)

### 3. Money & Lavoro (`/money-lavoro`)
- Stato Obiettivo (`ml_obj_status`)
- Patrimonio e runway analysis (`ml_patrimonio`)
- Transazioni con colonne: descrizione, importo, paid, categoria, data, conto, note (`ml_transazioni`, `ml_entrate_goal`)
- Entrate e uscite mensili separate (`ml_entrate`, `ml_uscite`, `ml_budget`)
- CRM clienti con pipeline drag-and-drop (`ml_crm`, `ml_crm_outreach`)
  - Stati: Identificato → Contattato → Risposto → Call/Meeting → Proposta → Acquisito → Perso → In pausa
  - Outreach counter giornaliero (obiettivo 3/giorno)
  - Generatore email outreach
  - Import contatti CSV da LinkedIn
  - Hunter.io API per trovare email
- Pipeline clienti (`ml_pipeline`, `ml_outreach`)
- Esperimenti attivi — Tiny Experiments (`ml_esperimenti`)
- Benessere lavorativo: burnout meter + purpose meter 1-10 (`ml_benessere`)
- Chat Claude (`sv_chat_ml`)

### 4. Relazioni (`/relazioni`)
- Stato Obiettivo (`rel_obj_status`)
- Cura personale: checklist settimanale (`rel_cura_personale`)
- Cura della casa: checklist settimanale (`rel_cura_casa`)
- Compagna: checklist giornaliera + streak (`rel_compagna_daily`, `rel_compagna_note`)
- Famiglia: lista contatti + alert 14 giorni (`rel_famiglia`)
- Tribù e networking: stati relazione + tracker eventi (`rel_tribu_persone`, `rel_tribu_eventi`)
- Energia sociale: check settimanale 1-10 (`rel_energia`)

### 5. Libertà (`/liberta`)
- Stato Obiettivo (`lib_obj_status`)
- Indicatore % remoto vs presenza mensile (`lib_workdays`, `lib_remote_goal`)
- Tracker giorni fuori Milano (`lib_locations`)
- Skill remote: ore investite + livello 1-10 (`lib_skills`, `lib_skill_goal`, `lib_study_log`)
- Pipeline clienti remote (`lib_platforms`, `lib_remote_clients`)
- Esperimenti remote con lessons learned (`lib_exp_remote`)
- Sistema XP gamificato (`lib_xp_log`):
  - 0-100: Freelance Catena
  - 101-300: Apprendista Remoto
  - 301-600: Nomade Aspirante
  - 601-1000: Knowledge Worker
  - 1000+: Location Independent
- Box "Il mio perché" fisso e non cancellabile (`lib_perche`)
- Chat Claude (`sv_chat_lib`)

### 6. Progetto Digitale (`/progetto-digitale`)
- Stato Obiettivo (`pd_obj_status`)
- In sviluppo — struttura base attiva

---

## Export dati tab

Ogni tab ha un bottone **"↓ Esporta dati tab"** che scarica un JSON.

**Regola fondamentale:** `downloadTabData` è una closure dentro il componente React — legge dallo **stato React** già sincronizzato con Firebase, **mai da localStorage**.

Pattern corretto:
```jsx
export default function MyTab() {
  const [data] = useFirebaseState('key', []);

  const downloadTabData = () => {
    triggerDownload({ exported_at: new Date().toISOString(), sections: { data } }, 'file.json');
  };
  // ...
}
```

Le immagini base64 (cover libri, poster film, foto progressi) vengono sempre omesse o sostituite con flag booleani nell'export.

---

## Integrazioni

### Attive
- **Firebase Realtime Database + Auth** — persistenza e autenticazione
- **Strava OAuth** — `VITE_STRAVA_CLIENT_ID`, `VITE_STRAVA_CLIENT_SECRET`; proxy Vite su `/strava-proxy`
- **OMDB API** — poster film, `sv_omdb_key` salvata in Firebase

### Pianificate
- **Netlify** — deploy (prossima priorità)
- **Apple Health** — import XML per sonno
- **Hunter.io** — prospecting email outreach
- **Oura Ring API** — sonno avanzato

---

## Variabili d'ambiente (`.env`)

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_STRAVA_CLIENT_ID
VITE_STRAVA_CLIENT_SECRET
```

---

## Categorie transazioni

`House_Expenses`, `Bills`, `Food`, `Extra_Food`, `Extra_Drink`, `Trips`, `Knowledge`, `Wealth`, `Freelance`, `Comunit`, `Investimenti`

## Conti bancari

`BBVA`, `Unicredit`, `CC`

---

## Pattern UI riutilizzabili

- **Stato Obiettivo** — sempre in cima a ogni tab, prima delle sezioni
- **Checklist** — cerchio vuoto → lime con check SVG animato
- **Streak** — numero grande + "gg" piccolo
- **Alert positivo** — testo lime
- **Alert negativo** — testo rosso `#e85454`
- **Chat Claude** — sempre in fondo a ogni tab
- **Sezione collassabile** — `▲/▼` nel header, stato in `useState`

---

## Regole ferree

- **Mai tracking calorie** con TDEE sotto 2500 per Samuele (TDEE corretto: 2500-2800)
- **Mai peso giornaliero** — solo lunedì
- **Mai gradienti o shadow decorative**
- **Mai localStorage** per l'export — sempre stato React/Firebase
- **Mai CSS modules** — tutto bundlato globalmente da Vite

---

## Prossime priorità

1. Deploy su Netlify
2. Fix counter rucking automatico da Strava
3. Sleep tracking attivo (import Apple Health XML)
4. Fix TDEE nutrizione (attuale default 1200 è sbagliato)
5. Sviluppo Progetto Digitale
