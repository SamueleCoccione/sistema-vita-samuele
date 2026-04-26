import { ref, set } from 'firebase/database';
import { db } from '../firebase';

const PREFIXES = ['sv_', 'ml_', 'rel_', 'lib_', 'dash_'];
export const MIGRATION_KEY = 'sv_migrated_v1';

export function migrationDone() {
  return !!localStorage.getItem(MIGRATION_KEY);
}

export async function migrateFromLocalStorage(onProgress) {
  const keys = Object.keys(localStorage).filter(k =>
    PREFIXES.some(p => k.startsWith(p))
  );

  const results = { migrated: 0, skipped: 0, keys: [] };

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === '') { results.skipped++; continue; }

    let valueToStore;
    try {
      JSON.parse(raw);
      // raw is already valid JSON — write it as-is (hook reads with JSON.parse)
      valueToStore = raw;
    } catch {
      // plain string (e.g. API keys) — wrap in JSON.stringify so hook can parse it back
      valueToStore = JSON.stringify(raw);
    }

    await set(ref(db, `utente/samuele/${key}`), valueToStore);
    results.migrated++;
    results.keys.push(key);
    onProgress?.(key, results.migrated, keys.length);
  }

  localStorage.setItem(MIGRATION_KEY, '1');
  return results;
}
