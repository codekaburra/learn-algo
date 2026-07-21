// Catalog + content-schema validation. Every AlgoModule is registered here; the
// registry test suite (registry.test.ts) validates all of them against the contract.

import type { AlgoModule, Category } from './types';

import bubble from './sorting/bubble';
import selection from './sorting/selection';
import insertion from './sorting/insertion';
import merge from './sorting/merge';
import quick from './sorting/quick';
import heap from './sorting/heap';
import counting from './sorting/counting';
import radix from './sorting/radix';
import twoSum from './arrays/two-sum';
import reverseArray from './arrays/reverse-array';
import palindrome from './arrays/palindrome';
import moveZeroes from './arrays/move-zeroes';
import dutchFlag from './arrays/dutch-flag';
import container from './arrays/container-water';
import slidingWindowMax from './arrays/sliding-window-max';
import longestSubstring from './arrays/longest-substring';
import prefixSum from './arrays/prefix-sum';
import kadane from './arrays/kadane';
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
  twoSum,
  reverseArray,
  palindrome,
  moveZeroes,
  dutchFlag,
  container,
  slidingWindowMax,
  longestSubstring,
  prefixSum,
  kadane,
  bubble,
  selection,
  insertion,
  merge,
  quick,
  heap,
  counting,
  radix,
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
