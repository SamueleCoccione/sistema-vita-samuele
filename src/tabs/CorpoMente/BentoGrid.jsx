import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useEditMode } from '../../contexts/EditModeContext';
import { useFirebaseState } from '../../hooks/useFirebaseState';
import { DEFAULT_LAYOUT, mergeWithDefaults } from './defaultLayout';
import SortableWidget from './SortableWidget';
import WeightModule          from './modules/WeightModule';
import StravaStreakModule    from './modules/StravaStreakModule';
import NutritionTodayModule  from './modules/NutritionTodayModule';
import WeeklyGoalsModule     from './modules/WeeklyGoalsModule';
import SleepModule           from './modules/SleepModule';
import BooksModule           from './modules/BooksModule';
import FilmsModule           from './modules/FilmsModule';
import JournalModule         from './modules/JournalModule';
import PhotosModule          from './modules/PhotosModule';
import BodyMeasuresModule    from './modules/BodyMeasuresModule';
import WeeklyAwarenessModule from './modules/WeeklyAwarenessModule';
import './BentoGrid.css';

const MODULES = {
  weight:        WeightModule,
  rucking:       StravaStreakModule,
  nutrition:     NutritionTodayModule,
  weeklyGoals:   WeeklyGoalsModule,
  sleep:         SleepModule,
  books:         BooksModule,
  films:         FilmsModule,
  journal:       JournalModule,
  photoProgress: PhotosModule,
  bodyMeasures:  BodyMeasuresModule,
  awareness:     WeeklyAwarenessModule,
};

const DownloadIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11h10"/>
  </svg>
);

function swapItems(items, activeId, overId) {
  const ai = items.findIndex(i => i.id === activeId);
  const oi = items.findIndex(i => i.id === overId);
  if (ai === -1 || oi === -1) return items;
  const next = [...items];
  [next[ai], next[oi]] = [next[oi], next[ai]];
  return next;
}

export default function BentoGrid({ onExport }) {
  const { isEditMode, enterEditMode, exitEditMode } = useEditMode();
  const [savedLayout, setSavedLayout] = useFirebaseState('sv_bento_layout', null);
  const [localItems, setLocalItems] = useState(DEFAULT_LAYOUT.items);
  const [toast, setToast] = useState(false);
  const initialized = useRef(false);

  // Hydrate from Firebase once on first load
  useEffect(() => {
    if (initialized.current || savedLayout === null) return;
    initialized.current = true;
    setLocalItems(mergeWithDefaults(savedLayout).items);
  }, [savedLayout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(({ active, over }) => {
    if (!over || active.id === over.id) return;
    setLocalItems(prev => swapItems(prev, active.id, over.id));
  }, []);

  const handleSizeChange = useCallback((id, size) => {
    setLocalItems(prev => prev.map(item => item.id === id ? { ...item, size } : item));
  }, []);

  const handleSave = () => {
    setSavedLayout({ items: localItems });
    exitEditMode();
    setToast(true);
    setTimeout(() => setToast(false), 2200);
  };

  const handleReset = () => {
    setLocalItems(DEFAULT_LAYOUT.items);
  };

  return (
    <section className="bento-section">
      {/* Barra sempre visibile in cima alla sezione bento */}
      <div className="bento-topbar">
        {isEditMode ? (
          <>
            <button className="bento-toolbar-btn bento-toolbar-btn--ghost" onClick={handleReset}>
              Ripristina
            </button>
            <span className="bento-toolbar-hint">Trascina per riordinare · ··· per ridimensionare</span>
            <button className="bento-toolbar-btn bento-toolbar-btn--save" onClick={handleSave}>
              Fatto
            </button>
          </>
        ) : (
          <>
            <button className="bento-edit-trigger-btn" onClick={enterEditMode}>
              Modifica layout
            </button>
            <span className="bento-topbar-spacer" />
            <button className="bento-export-btn" onClick={onExport}>
              <DownloadIcon />
              Esporta dati tab
            </button>
          </>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localItems.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="bento-grid">
            {localItems.map(item => {
              const ModuleComp = MODULES[item.id];
              return (
                <SortableWidget
                  key={item.id}
                  id={item.id}
                  size={item.size}
                  isEditMode={isEditMode}
                  onSizeChange={handleSizeChange}
                >
                  <ModuleComp size={item.size} />
                </SortableWidget>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {toast && (
        <div className="bento-toast" role="status" aria-live="polite">
          Layout salvato
        </div>
      )}
    </section>
  );
}
