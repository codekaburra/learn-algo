// Catalog + content-schema validation. Every AlgoModule is registered here; the
// registry test suite (registry.test.ts) validates all of them against the contract.

import type { AlgoModule, Category } from './types';

import bubble from './sorting/bubble';
import binarySearch from './searching/binary-search';
import reverseLinkedList from './linked-list/reverse-linked-list';
import dijkstra from './graphs/dijkstra';
import nQueens from './backtracking/n-queens';

export const CATEGORY_ORDER: Category[] = [
  'Arrays & Two Pointers',
  'Sorting',
  'Searching',
  'Linked List',
  'Stack & Queue',
  'Trees',
  'Heap',
  'Graphs',
  'Dynamic Programming',
  'Backtracking',
  'Greedy',
];

export const modules: AlgoModule[] = [
  bubble,
  binarySearch,
  reverseLinkedList,
  dijkstra,
  nQueens,
];

export const bySlug: Record<string, AlgoModule> = Object.fromEntries(
  modules.map((m) => [m.meta.slug, m]),
);

export function modulesByCategory(): { category: Category; items: AlgoModule[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    items: modules.filter((m) => m.meta.category === category),
  })).filter((g) => g.items.length > 0);
}
