import { useState, useMemo, useEffect } from 'react';
import { useFirebaseState } from '../../../hooks/useFirebaseState';
import './drawers.css';

const TARGETS = { kcal: 2100, protein: 130, carbs: 210, fat: 65 };
const CATEGORIES = ['Tutti', 'Colazione', 'Pranzo', 'Cena', 'Snack'];
const LIBRARY_VERSION = 'v3';

const DEFAULT_LIBRARY = [
  /* ── Colazione ── */
  {
    nome: 'Avena + uova strapazzate + banana', categoria: 'colazione', emoji: '🍳',
    kcal: 480, protein_g: 28, carbs_g: 65, fat_g: 12,
    descrizione: 'Ingredienti: 80g fiocchi d\'avena, 2 uova intere, 1 banana, 200ml acqua o latte di soia, sale.\n\nPreparazione: Cuoci l\'avena in acqua o latte di soia per 5 minuti mescolando. A parte, strapazza le uova in padella antiaderente con un filo d\'olio per 2 minuti. Servi affiancati con la banana a fette. Nessun condimento aggiuntivo necessario — la banana dà la dolcezza.',
  },
  {
    nome: 'Pane integrale + ricotta + miele', categoria: 'colazione', emoji: '🍞',
    kcal: 490, protein_g: 24, carbs_g: 58, fat_g: 18,
    descrizione: 'Ingredienti: 3 fette di pane integrale a fette, 150g ricotta vaccina, 1 cucchiaino di miele (10g).\n\nPreparazione: Tosta le fette di pane. Spalma abbondante ricotta su ciascuna fetta. Aggiungi un filo di miele sopra. Mangia subito. Variante: aggiungi cannella sulla ricotta al posto del miele per abbassare i carboidrati.',
  },
  {
    nome: 'Pancakes di avena e uova con yogurt', categoria: 'colazione', emoji: '🥞',
    kcal: 510, protein_g: 30, carbs_g: 55, fat_g: 16,
    descrizione: 'Ingredienti: 80g fiocchi d\'avena, 2 uova intere, 100ml latte di soia, 150g yogurt greco intero, pizzico di sale.\n\nPreparazione: Frulla i fiocchi d\'avena fino a farina grossolana. Mescola con le uova sbattute e il latte fino a ottenere un composto omogeneo. Cuoci in padella antiaderente leggermente oliata formando dischi da 8–10cm, circa 2 minuti per lato. Servi con lo yogurt greco sopra invece dello sciroppo. Rende 4–5 pancakes.',
  },
  {
    nome: 'Uova strapazzate con pomodoro + pane', categoria: 'colazione', emoji: '🍅',
    kcal: 460, protein_g: 26, carbs_g: 40, fat_g: 20,
    descrizione: 'Ingredienti: 3 uova intere, 150g pomodori freschi a cubetti (o ciliegini dimezzati), 2 fette pane integrale, olio EVO, sale, pepe, basilico opzionale.\n\nPreparazione: Taglia i pomodori a cubetti. Scalda un filo d\'olio in padella, aggiungi i pomodori e cuoci 2 minuti. Aggiungi le uova sbattute e mescola continuamente a fuoco medio-basso fino a consistenza cremosa. Togli dal fuoco mentre sono ancora leggermente umide — continuano a cuocere con il calore residuo. Servi sul pane tostato.',
  },
  {
    nome: 'Avena notturna con yogurt e frutti di bosco', categoria: 'colazione', emoji: '🫐',
    kcal: 500, protein_g: 30, carbs_g: 65, fat_g: 12,
    descrizione: 'Ingredienti: 80g fiocchi d\'avena, 150g yogurt greco intero, 200ml latte di soia, 150g frutti di bosco surgelati, 1 cucchiaino di miele opzionale.\n\nPreparazione (la sera prima): Mescola avena, yogurt e latte in un barattolo o contenitore con coperchio. Aggiungi i frutti di bosco ancora congelati sopra — scongelano durante la notte cedendo succo all\'avena. Chiudi e metti in frigo. La mattina è pronta, nessuna cottura. Agita prima di mangiare.',
  },
  {
    nome: 'French toast proteico con yogurt', categoria: 'colazione', emoji: '🍞',
    kcal: 580, protein_g: 34, carbs_g: 58, fat_g: 20,
    descrizione: 'Ingredienti: 3 fette di pane integrale, 3 uova intere, 80ml latte di soia, cannella q.b., 150g yogurt greco, 1 cucchiaino di miele.\n\nPreparazione: Sbatti le uova con il latte e un pizzico di cannella in un piatto fondo. Immergi ogni fetta di pane nel composto per 20–30 secondi per lato, lasciandola assorbire bene. Cuoci in padella antiaderente oliata a fuoco medio, 2–3 minuti per lato fino a doratura. Servi con yogurt greco e un filo di miele sopra. È un pasto sostanzioso — funziona bene anche da brunch.',
  },
  {
    nome: 'Uova in camicia + ricotta + pane', categoria: 'colazione', emoji: '🍳',
    kcal: 480, protein_g: 30, carbs_g: 38, fat_g: 22,
    descrizione: 'Ingredienti: 3 uova intere, 100g ricotta, 2 fette pane integrale, spinacino fresco q.b., aceto di vino bianco, sale.\n\nPreparazione: Porta a bollore acqua con un cucchiaio di aceto. Riduci il fuoco fino a sobbollire. Rompi ogni uovo in una tazzina, poi fallo scivolare delicatamente nell\'acqua. Cuoci 3 minuti per tuorlo morbido, 4 per sodo. Togli con il mestolo forato. Tosta il pane, spalma la ricotta, metti sopra qualche foglia di spinacino fresco e l\'uovo in camicia. Sale e pepe.',
  },
  {
    nome: 'Caffè', categoria: 'colazione', emoji: '☕',
    kcal: 5, protein_g: 0, carbs_g: 1, fat_g: 0,
    descrizione: 'Espresso o moka. Senza zucchero — o con al massimo uno. Non aggiunge macronutrienti rilevanti. Aggiungilo ogni volta che fai colazione per tenere il conteggio calorico accurato.',
  },

  /* ── Pranzo ── */
  {
    nome: 'Pasta e lenticchie', categoria: 'pranzo', emoji: '🍝',
    kcal: 620, protein_g: 32, carbs_g: 95, fat_g: 8,
    descrizione: 'Ingredienti: 80g pasta corta integrale (ditalini o tubetti), 100g lenticchie secche (o 200g in scatola già cotte), 200g polpa di pomodoro, 1 spicchio d\'aglio, olio EVO, rosmarino, sale, pepe.\n\nPreparazione: Se usi lenticchie secche, lessale 15 minuti in acqua salata — non serve ammollo. In una pentola capiente, soffriggi l\'aglio in olio, aggiungi la polpa di pomodoro e le lenticchie scolate. Cuoci 5 minuti. Aggiungi 500ml di acqua calda e porta a ebollizione. Versa la pasta direttamente nel brodo e cuoci mescolando spesso — deve assorbire quasi tutto il liquido. Il risultato è una zuppa densa, non asciutta. Aggiusta di sale e aggiungi rosmarino fresco.',
  },
  {
    nome: 'Riso e fagioli borlotti', categoria: 'pranzo', emoji: '🫘',
    kcal: 580, protein_g: 28, carbs_g: 95, fat_g: 10,
    descrizione: 'Ingredienti: 100g riso bianco, 200g fagioli borlotti in scatola (scolati e sciacquati), 1 cipolla piccola, olio EVO, rosmarino, sale.\n\nPreparazione: Soffriggi la cipolla tritata in olio a fuoco medio per 5 minuti. Aggiungi i fagioli scolati e rosmarino, cuoci 2 minuti mescolando. Aggiungi il riso crudo e 400ml di acqua calda. Cuoci coperto a fuoco basso 15–18 minuti finché il riso assorbe tutto il liquido. Puoi schiacciare una parte dei fagioli con il cucchiaio per rendere il composto più cremoso. Sale finale.',
  },
  {
    nome: 'Zuppa di ceci + pane integrale', categoria: 'pranzo', emoji: '🍲',
    kcal: 540, protein_g: 26, carbs_g: 78, fat_g: 12,
    descrizione: 'Ingredienti: 250g ceci in scatola (scolati), 1 patata media (150g), 1 spicchio d\'aglio, rosmarino, olio EVO, sale, pepe, 2 fette pane integrale.\n\nPreparazione: Pela e taglia la patata a cubetti da 1cm. In una pentola soffriggi aglio in olio, aggiungi ceci e patate, copri con 400ml acqua calda. Cuoci 15 minuti finché le patate sono tenere. Schiaccia grossolanamente un terzo dei ceci con il cucchiaio per addensare. Aggiusta di sale, aggiungi rosmarino. Servi con pane integrale tostato da intingere nel brodo.',
  },
  {
    nome: 'Pasta con tofu sbriciolato e capperi', categoria: 'pranzo', emoji: '🍝',
    kcal: 580, protein_g: 34, carbs_g: 75, fat_g: 16,
    descrizione: 'Ingredienti: 80g pasta integrale, 150g tofu compatto, 20g capperi sott\'aceto, 30g olive nere, 200g polpa di pomodoro, aglio, olio EVO, origano, sale.\n\nPreparazione: Sgocciola il tofu e sbriciolalo con le mani — deve avere la consistenza del tonno sminuzzato. Soffriggi aglio in olio, aggiungi il tofu sbriciolato e fallo rosolare 4–5 minuti fino a doratura. Aggiungi capperi, olive a rondelle e polpa di pomodoro. Cuoci il sugo 8 minuti. Nel frattempo lessia la pasta al dente, scolala e saltala nel sugo. Origano finale.',
  },
  {
    nome: 'Insalata di lenticchie e feta', categoria: 'pranzo', emoji: '🥗',
    kcal: 520, protein_g: 32, carbs_g: 48, fat_g: 18,
    descrizione: 'Ingredienti: 150g lenticchie in scatola (scolate e sciacquate), 80g feta, 150g pomodorini, 50g cipolla rossa, olio EVO, aceto di vino rosso, sale, pepe, prezzemolo opzionale.\n\nPreparazione: Scola e sciacqua bene le lenticchie. Taglia i pomodorini a metà, la cipolla rossa a fettine sottili. Sbriciola la feta grossolanamente. Mescola tutto in una ciotola. Condisci con olio, aceto, sale e pepe. Puoi prepararla la sera prima e tenerla in frigo — migliora macerando. Ottima fredda o a temperatura ambiente.',
  },
  {
    nome: 'Zuppa di orzo e fagioli cannellini', categoria: 'pranzo', emoji: '🥣',
    kcal: 600, protein_g: 30, carbs_g: 90, fat_g: 12,
    descrizione: 'Ingredienti: 80g orzo perlato, 200g fagioli cannellini in scatola (scolati), 1 carota, 1 costa di sedano, 1 cipolla piccola, rosmarino, olio EVO, sale, 30g parmigiano grattugiato.\n\nPreparazione: Trita grossolanamente carota, sedano e cipolla. Soffriggi in olio 5 minuti. Aggiungi i cannellini e l\'orzo crudo, copri con 600ml acqua calda. Porta a bollore, poi cuoci a fuoco basso 25 minuti mescolando di tanto in tanto — l\'orzo assorbe molto liquido, aggiungi acqua se necessario. La consistenza finale deve essere cremosa, quasi un risotto. Parmigiano abbondante sopra.',
  },

  /* ── Cena ── */
  {
    nome: 'Uova in purgatorio + pane integrale', categoria: 'cena', emoji: '🍅',
    kcal: 520, protein_g: 34, carbs_g: 42, fat_g: 22,
    descrizione: 'Ingredienti: 4 uova intere, 400g polpa di pomodoro, 1 spicchio d\'aglio, peperoncino (opzionale), olio EVO, sale, basilico, 2 fette pane integrale.\n\nPreparazione: In una padella larga con bordi alti, soffriggi aglio e peperoncino in olio. Aggiungi la polpa di pomodoro e cuoci 8 minuti finché il sugo si addensa. Crea 4 fossette nel sugo con il cucchiaio. Rompi un uovo in ogni fossetta. Copri con il coperchio e cuoci a fuoco basso 4 minuti per tuorlo morbido, 6 per sodo. Sale, basilico fresco. Servi con pane tostato da intingere.',
  },
  {
    nome: 'Frittata di patate, cipolle e parmigiano', categoria: 'cena', emoji: '🥔',
    kcal: 620, protein_g: 38, carbs_g: 42, fat_g: 28,
    descrizione: 'Ingredienti: 4 uova intere, 250g patate lesse (preparate prima o avanzate), 1 cipolla media, 40g parmigiano grattugiato, olio EVO, sale, pepe, prezzemolo.\n\nPreparazione: Lessa le patate finché tenere, tagliale a cubetti o fette. Soffriggi la cipolla affettata in olio fino a doratura (8 minuti). Aggiungi le patate e rosolale 2 minuti. Sbatti le uova con parmigiano, sale, pepe e prezzemolo. Versa il composto nella padella sulle patate e cipolla. Cuoci a fuoco medio-basso con coperchio 5 minuti. Gira la frittata con l\'aiuto del coperchio e cuoci altri 3 minuti. Buona anche fredda il giorno dopo.',
  },
  {
    nome: 'Tempeh saltato + riso + zucchine', categoria: 'cena', emoji: '🌿',
    kcal: 560, protein_g: 40, carbs_g: 60, fat_g: 18,
    descrizione: 'Ingredienti: 150g tempeh, 80g riso bianco, 200g zucchine, 2 cucchiai salsa di soia (o tamari), 1 spicchio d\'aglio, olio di semi, sesamo opzionale.\n\nPreparazione: Cuoci il riso. Taglia il tempeh a cubetti da 1cm e le zucchine a mezzelune. In padella o wok, scalda olio a fuoco alto. Aggiungi il tempeh e fallo dorare 4–5 minuti senza mescolare troppo — deve fare crosticina. Aggiungi aglio e zucchine, salta 3 minuti. Versa la salsa di soia, mescola e cuoci 1 minuto. Servi sul riso. Il tempeh deve essere dorato e croccante fuori, morbido dentro.',
  },
  {
    nome: 'Minestrone con fagioli e parmigiano', categoria: 'cena', emoji: '🥣',
    kcal: 580, protein_g: 34, carbs_g: 72, fat_g: 16,
    descrizione: 'Ingredienti: 200g fagioli cannellini in scatola, 400g verdure miste di stagione (zucchine, carote, patate, sedano, cipolla — quello che hai), 80g pasta piccola o riso, 40g parmigiano grattugiato, olio EVO, sale, alloro.\n\nPreparazione: Trita grossolanamente tutte le verdure in pezzi da 2cm. Soffriggi cipolla e carota in olio 5 minuti. Aggiungi le altre verdure, i fagioli e copri con 800ml acqua calda. Cuoci 20 minuti. Aggiungi la pasta o il riso e cuoci altri 10 minuti. Il minestrone deve essere denso, non brodoso. Parmigiano abbondante al servizio — è il modo più economico per aggiungere 10g di proteine.',
  },
  {
    nome: 'Frittata di spinaci e feta', categoria: 'cena', emoji: '🥬',
    kcal: 480, protein_g: 36, carbs_g: 6, fat_g: 32,
    descrizione: 'Ingredienti: 4 uova intere, 200g spinaci freschi, 60g feta, olio EVO, aglio, pepe.\n\nPreparazione: Salta gli spinaci in padella con aglio e un filo d\'olio a fuoco alto per 2–3 minuti finché appassiscono e perdono l\'acqua. Sgocciola bene. Sbatti le uova con pepe (no sale — la feta è già salata). Aggiungi gli spinaci alle uova sbattute e mescola. In padella oliata a fuoco medio, versa il composto. Sbricciola la feta sopra in modo uniforme. Copri e cuoci 5 minuti. Non girarla — finisce in forno a 180° per 5 minuti se vuoi la superficie dorata, oppure resta sul fuoco con coperchio.',
  },
  {
    nome: 'Shakshuka con feta e pane integrale', categoria: 'cena', emoji: '🍳',
    kcal: 680, protein_g: 44, carbs_g: 48, fat_g: 28,
    descrizione: 'Ingredienti: 5 uova intere, 400g polpa di pomodoro, 2 peperoni (200g), 1 cipolla, 50g feta, 2 fette pane integrale, olio EVO, cumino 1 cucchiaino, paprika affumicata 1 cucchiaino, sale, pepe.\n\nPreparazione: Taglia cipolla e peperoni a striscioline. Soffriggi in olio a fuoco medio 8 minuti finché morbidi. Aggiungi cumino e paprika, tosta 1 minuto. Aggiungi la polpa di pomodoro, aggiusta di sale e cuoci 10 minuti — il sugo deve addensarsi. Crea 5 fossette nel sugo. Rompi un uovo in ciascuna. Sbricciola la feta sopra tutto. Copri e cuoci a fuoco basso 5–7 minuti. Il tuorlo deve restare un po\' morbido. Servi con pane tostato.',
  },
  {
    nome: 'Tofu alla piastra con lenticchie e verdure', categoria: 'cena', emoji: '🌿',
    kcal: 560, protein_g: 42, carbs_g: 45, fat_g: 20,
    descrizione: 'Ingredienti: 200g tofu compatto, 150g lenticchie in scatola (scolate), 200g verdure di stagione (zucchine, melanzane, peperoni), salsa di soia, aglio, olio EVO, sale.\n\nPreparazione: Asciuga bene il tofu con carta da cucina — è fondamentale per la crosticina. Taglialo a fette da 1cm. Scalda una piastra o padella antiaderente a fuoco alto con poco olio. Cuoci il tofu 3–4 minuti per lato senza toccarlo — deve staccarsi da solo quando è dorato. Taglia le verdure e saltale in padella con aglio e olio 5 minuti. Scola e sciacqua le lenticchie, scaldале 2 minuti in padella con un goccio d\'olio e sale. Impiatta: lenticchie come base, verdure, tofu sopra, salsa di soia a filo.',
  },

  /* ── Snack ── */
  {
    nome: 'Yogurt greco + noci', categoria: 'snack', emoji: '🥛',
    kcal: 280, protein_g: 22, carbs_g: 15, fat_g: 16,
    descrizione: 'Ingredienti: 200g yogurt greco intero, 20g noci (circa 4–5 gherigli).\n\nNessuna preparazione. Versa lo yogurt in una ciotola, spezza le noci sopra. Le noci aggiungono grassi buoni e rallentano l\'assorbimento degli zuccheri dello yogurt — ti saziano più a lungo. Tienile già pesate in un sacchettino da 20g per accelerare il momento.',
  },
  {
    nome: '2 uova sode', categoria: 'snack', emoji: '🥚',
    kcal: 140, protein_g: 12, carbs_g: 1, fat_g: 10,
    descrizione: 'Ingredienti: 2 uova intere.\n\nPreparazione (falla in batch): Metti le uova in acqua fredda, porta a bollore, cuoci esattamente 9 minuti per tuorlo sodo. Raffredda subito in acqua fredda — si sbucciano molto più facilmente. Conserva in frigo con il guscio intatto fino a 5 giorni. Prepara 6–8 uova il lunedì mattina e hai snack proteici pronti per tutta la settimana. Sale e pepe al momento.',
  },
  {
    nome: 'Fette biscottate + burro di arachidi', categoria: 'snack', emoji: '🥜',
    kcal: 280, protein_g: 10, carbs_g: 32, fat_g: 14,
    descrizione: 'Ingredienti: 3 fette biscottate integrali, 30g burro di arachidi (circa 2 cucchiai colmi).\n\nNessuna preparazione. Spalma il burro di arachidi sulle fette. Attenzione alle quantità: 30g di burro di arachidi sono esattamente 2 cucchiai rasi — è facile abbondare. Scegli quello senza zuccheri aggiunti (ingrediente unico: arachidi). Lo trovi da Lidl a €2 il barattolo da 350g.',
  },
  {
    nome: 'Yogurt greco + miele', categoria: 'snack', emoji: '🍯',
    kcal: 210, protein_g: 20, carbs_g: 15, fat_g: 8,
    descrizione: 'Ingredienti: 200g yogurt greco intero, 1 cucchiaino di miele (10g).\n\nNessuna preparazione. Versa lo yogurt, aggiungi il miele a filo. È lo snack più veloce della lista — 30 secondi. Usa yogurt greco intero (non 0%) per la sazietà e il profilo aminoacidico migliore. Funziona bene anche come dessert dopo cena.',
  },
  {
    nome: 'Ricotta con cannella e miele', categoria: 'snack', emoji: '🥄',
    kcal: 220, protein_g: 16, carbs_g: 12, fat_g: 12,
    descrizione: 'Ingredienti: 150g ricotta vaccina, 1 cucchiaino di miele (10g), cannella in polvere q.b.\n\nNessuna preparazione. Metti la ricotta in una ciotola, aggiungi miele e cannella. Mescola leggermente. La cannella non è decorativa: rallenta l\'assorbimento degli zuccheri e dà una sensazione di dolce senza aggiungere calorie. Variante estiva: aggiungi frutti di bosco freschi invece del miele.',
  },
  {
    nome: 'Avena + yogurt greco + frutta', categoria: 'snack', emoji: '🍓',
    kcal: 320, protein_g: 22, carbs_g: 42, fat_g: 8,
    descrizione: 'Ingredienti: 60g fiocchi d\'avena, 150g yogurt greco intero, 150g frutta di stagione (fragole, pesche, mele — quello che c\'è).\n\nPreparazione: Mescola avena e yogurt in una ciotola. Aggiungi la frutta a pezzi sopra. È uno snack sostanzioso — usalo nel pomeriggio quando il pranzo è stato leggero o quando hai allenamento intenso. Puoi prepararlo la sera prima come l\'avena notturna.',
  },
  {
    nome: 'Banana', categoria: 'snack', emoji: '🍌',
    kcal: 90, protein_g: 1, carbs_g: 23, fat_g: 0,
    descrizione: '1 banana media (circa 120g). Zero preparazione. È il carburante rapido pre-rucking: mangiala 20–30 minuti prima di uscire per la camminata. Gli zuccheri naturali danno energia immediata senza appesantire. Non è uno snack proteico — combinala con qualcosa di proteico se la usi fuori dal contesto pre-allenamento.',
  },
  {
    nome: 'Yogurt greco serale', categoria: 'snack', emoji: '🌙',
    kcal: 200, protein_g: 20, carbs_g: 8, fat_g: 8,
    descrizione: 'Ingredienti: 200g yogurt greco intero.\n\nDa mangiare ogni sera, 30–60 minuti prima di dormire. Non è opzionale: è il modo più semplice per chiudere il gap proteico giornaliero e raggiungere i 130g. Le proteine del latte (caseina) si digeriscono lentamente durante il sonno e supportano il recupero muscolare notturno. Aggiungilo al diario ogni sera come voce fissa.',
  },
  {
    nome: 'Frutta di stagione', categoria: 'snack', emoji: '🍎',
    kcal: 80, protein_g: 1, carbs_g: 20, fat_g: 0,
    descrizione: 'Una porzione di frutta di stagione (circa 150–200g): mela, pera, arancia, peach, kiwi — quello che trovi al mercato. Nessun calcolo preciso necessario. È lo snack jolly quando hai voglia di qualcosa ma non hai fame vera. Non sazia a lungo da sola — abbinala a yogurt o uova sode se è uno spuntino strutturato.',
  },
];

function todayStr() { return new Date().toISOString().split('T')[0]; }
function pct(val, target) { return Math.min(100, Math.round((val / target) * 100)); }
function uid() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function proteinMessage(p) {
  const r = p / TARGETS.protein;
  if (r < 0.30) return 'Inizia con una fonte proteica 💪';
  if (r < 0.60) return 'Buon inizio. Punta a proteine nel prossimo pasto.';
  if (r < 1.00) return 'Quasi al target proteico. Ottimo.';
  return 'Target proteico raggiunto ✓';
}

/* ── Mini bar ── */
function MacroBar({ val, target, color, height = 5 }) {
  const p = pct(val, target);
  return (
    <div style={{ width: '100%', height, background: 'var(--color-line)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${p}%`, background: color, borderRadius: 999, transition: 'width 500ms ease-out' }} />
    </div>
  );
}

/* ── Progress section ── */
function ProgressSection({ totals }) {
  const { protein, kcal, carbs, fat } = totals;
  return (
    <section className="dr-section">
      <h3 className="dr-section-title">Oggi</h3>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 8 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 1, color: 'var(--color-ink)' }}>
            {Math.round(protein)}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--color-ink-muted)' }}>
            / {TARGETS.protein}g proteine
          </span>
        </div>
        <MacroBar val={protein} target={TARGETS.protein} color={pct(protein, TARGETS.protein) >= 100 ? 'var(--color-success)' : 'var(--color-teal)'} height={7} />
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-ink-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>
          {proteinMessage(protein)}
        </p>
      </div>
      <div style={{ display: 'flex', gap: 12, paddingTop: 12, borderTop: '1px solid var(--color-line)' }}>
        {[
          { label: 'Kcal',   val: kcal,  target: TARGETS.kcal,  color: 'var(--color-flame)',   unit: '' },
          { label: 'Carbo',  val: carbs, target: TARGETS.carbs, color: 'var(--color-flame)',   unit: 'g' },
          { label: 'Grassi', val: fat,   target: TARGETS.fat,   color: 'var(--color-magenta)', unit: 'g' },
        ].map(({ label, val, target, color, unit }) => (
          <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
              {label}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink)', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(val)}{unit}/{target}{unit}
            </span>
            <MacroBar val={val} target={target} color={color} height={4} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Today's log ── */
function TodayLogSection({ entries, onRemove }) {
  return (
    <section className="dr-section">
      <h3 className="dr-section-title">Pasti loggati ({entries.length})</h3>
      {entries.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)', margin: 0 }}>
          Nessun pasto loggato oggi.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {entries.map(e => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--color-line)' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{e.emoji || '🍽'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {e.nome}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {e.kcal} kcal · {e.protein_g}g P · {e.carbs_g}g C · {e.fat_g}g F
                </span>
              </div>
              <button
                onClick={() => onRemove(e.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-ink-muted)', fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                aria-label="Rimuovi"
              >×</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ── Meal detail panel (z-index 920, on top of AddMealModal) ── */
function MealDetailPanel({ meal, onAdd, onClose }) {
  const paragraphs = (meal.descrizione || '').split('\n\n').filter(Boolean);

  const macros = [
    { label: 'Proteine', val: meal.protein_g, unit: 'g', color: 'var(--color-teal)' },
    { label: 'Kcal',     val: meal.kcal,      unit: '',  color: 'var(--color-flame)' },
    { label: 'Carbs',    val: meal.carbs_g,   unit: 'g', color: 'var(--color-flame)' },
    { label: 'Grassi',   val: meal.fat_g,     unit: 'g', color: 'var(--color-magenta)' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 920, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} onClick={onClose} />
      <div style={{
        position: 'relative',
        background: 'var(--color-surface)',
        borderRadius: '16px 16px 0 0',
        display: 'flex', flexDirection: 'column',
        maxHeight: '82vh',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--color-line)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>{meal.emoji || '🍽'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 10px', lineHeight: 1.3 }}>
                {meal.nome}
              </h3>
              {/* Macro pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {macros.map(m => (
                  <div key={m.label} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '5px 10px', borderRadius: 8,
                    background: 'var(--color-surface-alt, #ede9e2)',
                    border: `1px solid ${m.color}22`,
                    minWidth: 52,
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: m.color, fontVariantNumeric: 'tabular-nums' }}>
                      {m.val}{m.unit}
                    </span>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 1 }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ overflowY: 'auto', padding: '16px 20px', flex: 1 }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{
              fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink)',
              lineHeight: 1.65, margin: i === 0 ? '0 0 14px' : '0',
            }}>
              {p}
            </p>
          ))}
        </div>

        {/* Actions */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-line)', display: 'flex', gap: 10, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: 8, border: '1px solid var(--color-line)',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600, color: 'var(--color-ink-muted)',
            }}
          >
            Annulla
          </button>
          <button
            onClick={onAdd}
            style={{
              flex: 2, padding: '12px', borderRadius: 8, border: 'none',
              background: 'var(--color-teal)', cursor: 'pointer',
              fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 700, color: '#fff',
              letterSpacing: '0.04em',
            }}
          >
            Aggiungi al diario
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add meal modal (z-index 900) ── */
function AddMealModal({ library, onAdd, onClose, onCreateNew }) {
  const [tab, setTab] = useState('Tutti');
  const [selected, setSelected] = useState(null);

  const filtered = tab === 'Tutti'
    ? library
    : library.filter(m => (m.categoria || '').toLowerCase() === tab.toLowerCase());

  function handleAdd(meal) {
    onAdd(meal);
    setSelected(null);
    onClose();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 900, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', display: 'flex', flexDirection: 'column', maxHeight: '88vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 12px', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15, fontWeight: 700, color: 'var(--color-ink)' }}>Aggiungi pasto</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--color-ink-muted)', padding: 0, lineHeight: 1 }}>×</button>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', overflowX: 'auto', padding: '0 20px', borderBottom: '1px solid var(--color-line)', flexShrink: 0 }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setTab(c)}
              style={{
                fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
                padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer',
                color: tab === c ? 'var(--color-teal)' : 'var(--color-ink-muted)',
                borderBottom: tab === c ? '2px solid var(--color-teal)' : '2px solid transparent',
                whiteSpace: 'nowrap', transition: 'color 120ms', marginBottom: -1,
              }}
            >{c}</button>
          ))}
        </div>

        {/* Meal grid */}
        <div style={{ overflowY: 'auto', padding: '12px 16px', flex: 1 }}>
          {filtered.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--color-ink-muted)', textAlign: 'center', padding: '24px 0' }}>
              Nessun pasto in questa categoria.
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {filtered.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelected(m)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                    padding: '10px 12px', background: 'var(--color-surface-alt, #ede9e2)',
                    border: '1px solid var(--color-line)', borderRadius: 10,
                    cursor: 'pointer', textAlign: 'left', transition: 'border-color 120ms',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-teal)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-line)'}
                >
                  <span style={{ fontSize: 20 }}>{m.emoji || '🍽'}</span>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--color-ink)', lineHeight: 1.3 }}>
                    {m.nome}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-teal)', fontVariantNumeric: 'tabular-nums' }}>
                    {m.protein_g}g P · {m.kcal} kcal
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-line)', textAlign: 'center', flexShrink: 0 }}>
          <button
            onClick={onCreateNew}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--color-teal)', textDecoration: 'underline', padding: 0 }}
          >
            ＋ Crea nuovo pasto
          </button>
        </div>
      </div>

      {/* Detail panel opens on top of this modal */}
      {selected && (
        <MealDetailPanel
          meal={selected}
          onAdd={() => handleAdd(selected)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

/* ── New meal form (z-index 950) ── */
function NewMealForm({ onSave, onClose }) {
  const [form, setForm] = useState({ nome: '', categoria: 'snack', emoji: '🍽', kcal: '', protein_g: '', carbs_g: '', fat_g: '', descrizione: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.nome.trim() && form.kcal && form.protein_g;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 950, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: 'var(--color-surface)', borderRadius: '16px 16px 0 0', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '88vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontFamily: 'var(--font-ui)', fontSize: 14, fontWeight: 700, color: 'var(--color-ink)', margin: 0 }}>Nuovo pasto</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-ink-muted)', padding: 0, lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>Nome</label>
            <input className="cm-input" placeholder="es. Porridge" value={form.nome} onChange={e => set('nome', e.target.value)} style={{ fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>Emoji</label>
            <input className="cm-input" value={form.emoji} onChange={e => set('emoji', e.target.value)} style={{ fontSize: 20, width: 52, textAlign: 'center', padding: '6px 4px' }} maxLength={2} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>Categoria</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.filter(c => c !== 'Tutti').map(c => {
              const val = c.toLowerCase();
              return (
                <button key={c} onClick={() => set('categoria', val)} style={{
                  fontFamily: 'var(--font-ui)', fontSize: 11, fontWeight: 600,
                  padding: '5px 12px', borderRadius: 20, border: '1px solid var(--color-line)', cursor: 'pointer',
                  background: form.categoria === val ? 'var(--color-teal)' : 'transparent',
                  color: form.categoria === val ? '#fff' : 'var(--color-ink-muted)',
                  transition: 'all 150ms',
                }}>{c}</button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { k: 'kcal', label: 'Kcal' },
            { k: 'protein_g', label: 'Proteine (g)' },
            { k: 'carbs_g', label: 'Carboidrati (g)' },
            { k: 'fat_g', label: 'Grassi (g)' },
          ].map(({ k, label }) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>{label}</label>
              <input className="cm-input" type="number" min="0" value={form[k]} onChange={e => set(k, e.target.value)} style={{ fontSize: 13 }} placeholder="0" />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>Descrizione (opzionale)</label>
          <textarea
            className="cm-input"
            rows={4}
            placeholder="Ingredienti e preparazione..."
            value={form.descrizione}
            onChange={e => set('descrizione', e.target.value)}
            style={{ fontSize: 13, resize: 'vertical', lineHeight: 1.5 }}
          />
        </div>

        <button
          className="cm-btn"
          disabled={!valid}
          onClick={() => onSave({
            nome: form.nome.trim(), categoria: form.categoria, emoji: form.emoji || '🍽',
            kcal: Number(form.kcal) || 0, protein_g: Number(form.protein_g) || 0,
            carbs_g: Number(form.carbs_g) || 0, fat_g: Number(form.fat_g) || 0,
            descrizione: form.descrizione.trim(),
          })}
          style={{ opacity: valid ? 1 : 0.4, cursor: valid ? 'pointer' : 'not-allowed', padding: '12px', fontSize: 12 }}
        >
          Aggiungi alla libreria
        </button>
      </div>
    </div>
  );
}

/* ── Main drawer ── */
export default function NutritionDrawer() {
  const [library, setLibrary, libraryLoaded]   = useFirebaseState('sv_nutrition_library', []);
  const [libraryVer, setLibraryVer, verLoaded] = useFirebaseState('sv_nutrition_library_ver', null);
  const [log, setLog, logLoaded]               = useFirebaseState('sv_nutrition_log', []);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewForm, setShowNewForm]   = useState(false);

  useEffect(() => {
    if (!libraryLoaded || !verLoaded) return;
    if (library.length === 0 || libraryVer !== LIBRARY_VERSION) {
      setLibrary(DEFAULT_LIBRARY.map((m, i) => ({ ...m, id: `default-${i}` })));
      setLibraryVer(LIBRARY_VERSION);
    }
  }, [libraryLoaded, verLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const today = todayStr();

  const { todayEntries, totals } = useMemo(() => {
    const todayEntries = log.filter(e => e.date === today);
    const totals = {
      kcal:    todayEntries.reduce((s, e) => s + (e.kcal      || 0), 0),
      protein: todayEntries.reduce((s, e) => s + (e.protein_g || 0), 0),
      carbs:   todayEntries.reduce((s, e) => s + (e.carbs_g   || 0), 0),
      fat:     todayEntries.reduce((s, e) => s + (e.fat_g     || 0), 0),
    };
    return { todayEntries, totals };
  }, [log, today]);

  function addMealToLog(meal) {
    setLog([...log, {
      id: uid(), date: today,
      nome: meal.nome, emoji: meal.emoji || '🍽',
      kcal: meal.kcal || 0, protein_g: meal.protein_g || 0,
      carbs_g: meal.carbs_g || 0, fat_g: meal.fat_g || 0,
      mealId: meal.id,
    }]);
  }

  function saveNewMeal(meal) {
    const newMeal = { ...meal, id: uid() };
    setLibrary([...library, newMeal]);
    setShowNewForm(false);
    addMealToLog(newMeal);
  }

  return (
    <div className="dr-content">
      {logLoaded && <ProgressSection totals={totals} />}
      {logLoaded && <TodayLogSection entries={todayEntries} onRemove={id => setLog(log.filter(e => e.id !== id))} />}

      <div style={{ position: 'sticky', bottom: 0, padding: '12px 20px', background: 'var(--color-surface)', borderTop: '1px solid var(--color-line)' }}>
        <button
          className="cm-btn"
          onClick={() => setShowAddModal(true)}
          style={{ width: '100%', padding: '14px', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em' }}
        >
          + Aggiungi pasto
        </button>
      </div>

      {showAddModal && (
        <AddMealModal
          library={library}
          onAdd={addMealToLog}
          onClose={() => setShowAddModal(false)}
          onCreateNew={() => { setShowAddModal(false); setShowNewForm(true); }}
        />
      )}

      {showNewForm && (
        <NewMealForm
          onSave={saveNewMeal}
          onClose={() => setShowNewForm(false)}
        />
      )}
    </div>
  );
}
