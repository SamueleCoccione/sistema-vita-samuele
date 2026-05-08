export const WIDGET_IDS = ['patrimonio', 'transazioni', 'crm', 'esperimenti', 'benessere'];

export const DEFAULT_LAYOUT = {
  items: [
    { id: 'patrimonio',  size: 'M' },
    { id: 'transazioni', size: 'M' },
    { id: 'crm',         size: 'L' },
    { id: 'esperimenti', size: 'M' },
    { id: 'benessere',   size: 'M' },
  ],
};

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
