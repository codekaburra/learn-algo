import type { Category } from '../algos/types';

interface CatMeta {
  accent: string; // css var reference
  glow: string;
  short: string;
}

export const CATEGORY_META: Record<Category, CatMeta> = {
  'Arrays & Two Pointers': { accent: 'var(--cat-arrays)', glow: 'var(--cat-arrays-glow)', short: 'Arrays' },
  Sorting: { accent: 'var(--cat-sorting)', glow: 'var(--cat-sorting-glow)', short: 'Sorting' },
  Searching: { accent: 'var(--cat-searching)', glow: 'var(--cat-searching-glow)', short: 'Searching' },
  'Linked List': { accent: 'var(--cat-linked)', glow: 'var(--cat-linked-glow)', short: 'Linked List' },
  'Stack & Queue': { accent: 'var(--cat-stack)', glow: 'var(--cat-stack-glow)', short: 'Stack/Queue' },
  Trees: { accent: 'var(--cat-trees)', glow: 'var(--cat-trees-glow)', short: 'Trees' },
  Heap: { accent: 'var(--cat-heap)', glow: 'var(--cat-heap-glow)', short: 'Heap' },
  Graphs: { accent: 'var(--cat-graphs)', glow: 'var(--cat-graphs-glow)', short: 'Graphs' },
  'Dynamic Programming': { accent: 'var(--cat-dp)', glow: 'var(--cat-dp-glow)', short: 'DP' },
  Backtracking: { accent: 'var(--cat-backtracking)', glow: 'var(--cat-backtracking-glow)', short: 'Backtracking' },
  Greedy: { accent: 'var(--cat-greedy)', glow: 'var(--cat-greedy-glow)', short: 'Greedy' },
};

export function accentVars(category: Category): React.CSSProperties {
  const meta = CATEGORY_META[category];
  return { ['--accent' as string]: meta.accent, ['--glow' as string]: meta.glow };
}
