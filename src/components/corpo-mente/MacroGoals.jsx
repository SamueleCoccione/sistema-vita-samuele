import { useState } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const DEFAULTS = { proteine: 180, carboidrati: 250, grassi: 70, calorie: 2400 };
const KEY = 'sv_macros';

const ITEMS = [
  { id: 'proteine',    label: 'Proteine',    unit: 'g'    },
  { id: 'carboidrati', label: 'Carboidrati', unit: 'g'    },
  { id: 'grassi',      label: 'Grassi',      unit: 'g'    },
  { id: 'calorie',     label: 'Calorie',     unit: 'kcal' },
];

export default function MacroGoals() {
  const [macros, setMacros] = useFirebaseState(KEY, DEFAULTS);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');

  const startEdit = (id) => { setEditing(id); setDraft(String(macros[id])); };

  const commit = () => {
    const v = parseInt(draft, 10);
    if (!isNaN(v) && v > 0) setMacros({ ...macros, [editing]: v });
    setEditing(null);
  };

  return (
    <div className="cm-macros">
      {ITEMS.map(({ id, label, unit }) => (
        <div key={id} className="cm-macro-card">
          <div className="cm-macro-label">{label}</div>
          {editing === id ? (
            <input
              className="cm-input"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={e => e.key === 'Enter' && commit()}
              autoFocus
              style={{ width: 90, fontSize: 22, fontWeight: 800 }}
            />
          ) : (
            <div className="cm-macro-value" onClick={() => startEdit(id)} title="Clicca per modificare">
              {macros[id]}<span className="cm-macro-unit">{unit}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
