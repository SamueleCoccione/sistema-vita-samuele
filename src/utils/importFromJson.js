import { ref, set } from 'firebase/database';
import { db } from '../firebase';

const ALLOWED_PREFIXES = ['sv_', 'ml_', 'rel_', 'lib_', 'dash_'];

export async function importJsonToFirebase(jsonObj, onProgress) {
  const keys = Object.keys(jsonObj).filter(k =>
    ALLOWED_PREFIXES.some(p => k.startsWith(p))
  );

  if (keys.length === 0) throw new Error('Nessuna chiave valida trovata nel file.');

  let done = 0;
  for (const key of keys) {
    const value = jsonObj[key];
    // Store as JSON string (same format useFirebaseState expects)
    const serialized = JSON.stringify(value);
    await set(ref(db, `utente/samuele/${key}`), serialized);
    // Mirror to localStorage cache
    try { localStorage.setItem(key, serialized); } catch {}
    done++;
    onProgress?.(key, done, keys.length);
  }

  // Mark migration done so the localStorage migration banner stays hidden
  localStorage.setItem('sv_migrated_v1', '1');
  return { imported: done, keys };
}
