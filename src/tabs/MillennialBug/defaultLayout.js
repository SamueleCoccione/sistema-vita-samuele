export const WIDGET_IDS = [
  'pubblicazioni', 'calendario', 'bozze', 'journal', 'voce', 'ciclo', 'writing',
];

export const DEFAULT_LAYOUT = {
  items: [
    { id: 'pubblicazioni', size: 'M' },
    { id: 'calendario',    size: 'M' },
    { id: 'bozze',         size: 'M' },
    { id: 'journal',       size: 'M' },
    { id: 'voce',          size: 'M' },
    { id: 'ciclo',         size: 'M' },
    { id: 'writing',       size: 'L' },
  ],
};

export function mergeWithDefaults(saved) {
  if (!saved || !Array.isArray(saved.items) || saved.items.length === 0) return DEFAULT_LAYOUT;
  const validIds = new Set(WIDGET_IDS);
  const savedIds = new Set(saved.items.map(i => i.id));
  const valid    = saved.items.filter(i => validIds.has(i.id));
  const missing  = DEFAULT_LAYOUT.items.filter(i => !savedIds.has(i.id));
  return { items: [...valid, ...missing] };
}
