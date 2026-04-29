import { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import { useFirebaseState, removeFirebaseData } from '../../hooks/useFirebaseState';

const HISTORY_KEY = 'sv_chat_ml';
const APIKEY_KEY  = 'sv_groq_key';
const MODEL       = 'llama-3.3-70b-versatile';

const SYSTEM = `Sei il coach finanziario e lavorativo di Samuele.
Rispondi sempre in italiano, in modo diretto, pratico e conciso. Niente preamboli.
Sei esperto di: freelancing, crescita economica, pricing, pipeline clienti, gestione del tempo, tiny experiments, burnout, finanza personale, investimenti.
Quando Samuele incolla dati JSON dall'export della tab, analizzali e dai consigli specifici basati sui numeri reali.
Non essere prolisso. Vai dritto al punto.`;

export default function MoneyChat() {
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
          <div className="ml-chat-title">Advisor — Llama 3.3</div>
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
            Inserisci la tua Groq API key (gratuita su console.groq.com) — o incolla il JSON esportato in chat per un&apos;analisi immediata
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
                Chiedi un consiglio — o incolla il JSON esportato dalla tab per un&apos;analisi dei tuoi dati
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
              placeholder="Scrivi a Claude o incolla il JSON export..."
              disabled={busy}
            />
            <button className="cm-btn" onClick={send} disabled={busy}>{busy ? '...' : 'Invia'}</button>
          </div>
        </>
      )}
    </div>
  );
}
