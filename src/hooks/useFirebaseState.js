import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db } from '../firebase';

const BASE = 'utente/samuele';

/**
 * Drop-in replacement for useState + localStorage.
 * Stores values as JSON strings in Firebase to preserve array order.
 * Also mirrors writes to localStorage so synchronous reads (download, etc.) still work.
 *
 * Returns [value, setValue, loaded]
 */
export function useFirebaseState(key, defaultValue) {
  const [state,  setState]  = useState(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const r = ref(db, `${BASE}/${key}`);
    const unsub = onValue(r, (snap) => {
      const raw = snap.val();
      if (raw !== null && raw !== undefined) {
        try {
          const parsed = JSON.parse(raw);
          // eslint-disable-next-line no-console
          console.log(`[Firebase ✓] ${key}:`, parsed);
          setState(parsed);
        } catch {
          // eslint-disable-next-line no-console
          console.warn(`[Firebase parse error] ${key}:`, raw);
          setState(defaultValue);
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn(`[Firebase vuoto] ${key} — nessun dato nel db (o non autenticato)`);
      }
      setLoaded(true);
    }, (error) => {
      // eslint-disable-next-line no-console
      console.error(`[Firebase errore] ${key}:`, error.message);
      setLoaded(true);
    });
    return unsub;
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const setValue = useCallback((next) => {
    setState(next);
    const serialized = JSON.stringify(next);
    set(ref(db, `${BASE}/${key}`), serialized);
    try { localStorage.setItem(key, serialized); } catch {}
  }, [key]);

  return [state, setValue, loaded];
}

/** Removes a key from Firebase and localStorage (e.g. on logout/clear). */
export function removeFirebaseData(key) {
  remove(ref(db, `${BASE}/${key}`));
  localStorage.removeItem(key);
}
