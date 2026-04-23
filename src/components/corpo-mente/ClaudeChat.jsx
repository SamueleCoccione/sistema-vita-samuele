import { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';

const HISTORY_KEY = 'sv_chat_cm';
const APIKEY_KEY  = 'sv_anthropic_key';

const SYSTEM = `Sei il coach personale di Samuele per corpo, mente e benessere.
Rispondi sempre in italiano, in modo diretto, pratico e conciso.
Sei esperto di: allenamento fisico, rucking, nutrizione, lettura, abitudini, mindset.
Non essere prolisso. Niente introduzioni. Vai dritto al punto.`;

export default function ClaudeChat() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(APIKEY_KEY) || '');
  const [keyDraft, setKeyDraft] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(!localStorage.getItem(APIKEY_KEY));
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const saveKey = () => {
    const k = keyDraft.trim();
    if (!k) return;
    localStorage.setItem(APIKEY_KEY, k);
    setApiKey(k);
    setShowKeyInput(false);
    setKeyDraft('');
  };

  const removeKey = () => {
    localStorage.removeItem(APIKEY_KEY);
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
      const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
      let text = '';
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const stream = await client.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        system: SYSTEM,
        messages: history,
        stream: true,
      });

      for await (const ev of stream) {
        if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
          text += ev.delta.text;
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: text };
            return next;
          });
        }
      }

      const final = [...history, { role: 'assistant', content: text }];
      localStorage.setItem(HISTORY_KEY, JSON.stringify(final.slice(-30)));
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
          <div className="cm-card-title" style={{ marginBottom: 2 }}>Coach — Claude Opus</div>
          {apiKey && !showKeyInput && (
            <div className="cm-chat-model">
              API key attiva ·{' '}
              <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={removeKey}>rimuovi</span>
            </div>
          )}
        </div>
        {messages.length > 0 && (
          <button className="cm-btn cm-btn-ghost" onClick={() => { setMessages([]); localStorage.removeItem(HISTORY_KEY); }}>
            Cancella
          </button>
        )}
      </div>

      {showKeyInput ? (
        <div className="cm-key-setup">
          <div style={{ fontSize: 12, color: 'var(--cm-text2)' }}>Inserisci la tua Anthropic API key per attivare il coach</div>
          <div className="cm-key-row">
            <input
              className="cm-input"
              type="password"
              value={keyDraft}
              onChange={e => setKeyDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveKey()}
              placeholder="sk-ant-api03-..."
              style={{ flex: 1 }}
            />
            <button className="cm-btn" onClick={saveKey}>Salva</button>
          </div>
          <div className="cm-key-note">Salvata solo in localStorage del browser — nessun server coinvolto</div>
        </div>
      ) : (
        <>
          <div className="cm-chat-msgs">
            {messages.length === 0 && (
              <div className="cm-empty">Scrivi qualcosa per iniziare la conversazione</div>
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
              placeholder="Scrivi a Claude..."
              disabled={busy}
            />
            <button className="cm-btn" onClick={send} disabled={busy}>
              {busy ? '...' : 'Invia'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
