export const WIDGET_IDS = [
  'weight', 'rucking', 'nutrition', 'weeklyGoals', 'sleep',
  'books', 'films', 'journal', 'photoProgress', 'bodyMeasures', 'awareness',
];

export const DEFAULT_LAYOUT = {
  items: [
    { id: 'weight',       size: 'L' },
    { id: 'rucking',      size: 'S' },
    { id: 'nutrition',    size: 'S' },
    { id: 'weeklyGoals',  size: 'S' },
    { id: 'sleep',        size: 'S' },
    { id: 'books',        size: 'M' },
    { id: 'films',        size: 'M' },
    { id: 'journal',      size: 'M' },
    { id: 'photoProgress',size: 'M' },
    { id: 'bodyMeasures', size: 'M' },
    { id: 'awareness',    size: 'M' },
  ],
};

/**
 * Merge saved layout with defaults:
 * - drops items whose ID no longer exists
 * - appends any new items added to DEFAULT_LAYOUT
 */
export function mergeWithDefaults(saved) {
  if (!saved || !Array.isArray(saved.items) || saved.items.length === 0) {
    return DEFAULT_LAYOUT;
  }
  const validIds = new Set(WIDGET_IDS);
  const savedIds = new Set(saved.items.map(i => i.id));
  const valid    = saved.items.filter(i => validIds.has(i.id));
  const missing  = DEFAULT_LAYOUT.items.filter(i => !savedIds.has(i.id));
  return { items: [...valid, ...missing] };
}
