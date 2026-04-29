import { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import { useFirebaseState, removeFirebaseData } from '../../hooks/useFirebaseState';

const HISTORY_KEY = 'sv_chat_lib';
const APIKEY_KEY  = 'sv_groq_key';
const MODEL       = 'llama-3.3-70b-versatile';

const SYSTEM = `Sei il coach di libertà geografica e lavoro remoto di Samuele.
Rispondi sempre in italiano, in modo diretto, pratico e conciso. Niente preamboli.
Sei esperto di: freelancing internazionale, nomadismo digitale, acquisizione clienti esteri, costruzione portfolio online, piattaforme remote (Toptal, Upwork, Working Nomads), pricing, personal branding, transizione da lavoro locale a 100% remoto, libertà finanziaria.
L'obiettivo di Samuele è lavorare da remoto e avere libertà geografica, uscendo dalla dipendenza da Milano.
Quando Samuele ti dà dati su skill, clienti o esperimenti, analizzali e dai consigli specifici e azionabili.
Non essere prolisso. Vai dritto al punto. Dai sempre un prossimo passo concreto.`;

export default function LibertaChat() {
  const [apiKey,    setApiKey]   = useFirebaseState(APIKEY_KEY, '');
  const [messages,  setMessages, messagesLoaded] = useFirebaseState(HISTORY_KEY, []);
  const [keyDraft,     setKeyDraft]     = useState('');
  const [showKeyInput, setShowKeyInput] = useState(true);
  const [input, setInput] = useState('');
  const [busy,  setBusy]  = useState(false);
  const bottomRef  = useRef(null);
  const prevLenRef = useRef(Infinity);

  useEffect(() => {
    setShowKeyInput(!apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (!messagesLoaded) return;
    if (messages.length > prevLenRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLenRef.current = messages.length;
  }, [messages, messagesLoaded]);

  const saveKey = () => {
    const k = keyDraft.trim();
    if (!k) return;
    setApiKey(k);
    setShowKeyInput(false);
    setKeyDraft('');
  };

  const removeKey = () => {
    removeFirebaseData(APIKEY_KEY);
    setApiKey('');
    setShowKeyInput(true);
  };

  const send = async () => {
    if (!apiKey || !input.trim() || busy) return;
    const userMsg = { role: 'user', content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setBusy(true);

    try {
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });
      let text = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const stream = await groq.chat.completions.create({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: 'system', content: SYSTEM }, ...history],
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          text += delta;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: text };
            return next;
          });
        }
      }

      const final = [...history, { role: 'assistant', content: text }];
      setMessages(final.slice(-30));
    } catch (err) {
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: `Errore: ${err.message}` };
        return next;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cm-chat-wrap">
      <div className="cm-chat-head">
        <div>
          <div className="ml-chat-title">Strategia Remoto — Llama 3.3</div>
          {apiKey && !showKeyInput && (
            <div className="cm-chat-model">
              API key attiva ·{' '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={removeKey}>rimuovi</span>
            </div>
          )}
        </div>
        {messages.length > 0 && (
          <button className="cm-btn cm-btn-ghost" onClick={() => { setMessages([]); removeFirebaseData(HISTORY_KEY); }}>
            Cancella
          </button>
        )}
      </div>

      {showKeyInput ? (
        <div className="cm-key-setup">
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>
            Inserisci la tua Groq API key (gratuita su console.groq.com) per strategie e decisioni sul lavoro remoto
          </div>
          <div className="cm-key-row">
            <input
              className="cm-input"
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="gsk_..."
              style={{ flex: 1 }}
            />
            <button className="cm-btn" onClick={saveKey}>Salva</button>
          </div>
          <div className="cm-key-note">Salvata in Firebase — sincronizzata su tutti i dispositivi</div>
        </div>
      ) : (
        <>
          <div className="cm-chat-msgs">
            {messages.length === 0 && (
              <div className="cm-empty">
                Chiedi strategie su lavoro remoto, acquisizione clienti esteri, o come accelerare la tua libertà geografica
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'cm-msg-user' : 'cm-msg-assistant'}>
                {m.content || (busy && i === messages.length - 1 ? '▋' : '')}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="cm-chat-bottom">
            <input
              className="cm-input"
              style={{ flex: 1 }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Chiedi strategia remoto, clienti, skill..."
              disabled={busy}
            />
            <button className="cm-btn" onClick={send} disabled={busy}>{busy ? '...' : 'Invia'}</button>
          </div>
        </>
      )}
    </div>
  );
}
