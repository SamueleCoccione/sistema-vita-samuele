import { useState, useRef } from 'react';
import { useFirebaseState } from '../../hooks/useFirebaseState';

const KEY = 'sv_body_photos';

function fmt(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('it-IT', {
    day: '2-digit', month: 'short', year: '2-digit',
  });
}

export default function BodyPhotos() {
  const [photos, setPhotos] = useFirebaseState(KEY, []);
  const fileRef = useRef();

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const entry = { id: Date.now(), date: new Date().toISOString().split('T')[0], src: ev.target.result };
      setPhotos([entry, ...photos]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const remove = (id) => setPhotos(photos.filter(p => p.id !== id));

  return (
    <div>
      <div className="cm-upload-area" onClick={() => fileRef.current.click()}>
        + Aggiungi foto lunedì
        <div style={{ fontSize: 10, marginTop: 3, opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}>
          JPG · PNG · archiviata in locale
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {photos.length === 0
        ? <div className="cm-empty">Nessuna foto ancora</div>
        : (
          <div className="cm-photo-grid">
            {photos.map(p => (
              <div key={p.id} className="cm-photo-item" onClick={() => remove(p.id)} title="Click per rimuovere">
                <img src={p.src} alt={p.date} />
                <div className="cm-photo-date">{fmt(p.date)}</div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
