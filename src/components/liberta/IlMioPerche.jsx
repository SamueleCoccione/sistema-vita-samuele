import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'lib_perche';

const DEFAULT = `Voglio tornare potente — dai miei fratelli che non conosco, dai nonni, dalla famiglia.
Milano è il mezzo, non il fine.`;

export default function IlMioPerche() {
  const [text, setText] = useFirebaseState(KEY, DEFAULT);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const startEdit = () => { setDraft(text); setEditing(true); };
  const save = () => { setText(draft); setEditing(false); };
  const cancel = () => setEditing(false);

  return (
    <div className="lb-perche-box">
      <div className="lb-perche-lbl">Il mio perché — non si cancella, si evolve</div>
      {editing ? (
        <>
          <textarea
            className="cm-input cm-textarea lb-perche-textarea"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="lb-perche-actions">
            <button className="cm-btn" onClick={save}>Salva</button>
            <button className="cm-btn cm-btn-ghost" onClick={cancel}>Annulla</button>
          </div>
        </>
      ) : (
        <>
          <div className="lb-perche-text">{text}</div>
          <div className="lb-perche-actions">
            <button className="cm-btn cm-btn-ghost" onClick={startEdit}>Modifica</button>
          </div>
        </>
      )}
    </div>
  );
}
