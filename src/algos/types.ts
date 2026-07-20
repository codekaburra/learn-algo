// The AlgoModule contract (ARCHITECTURE.md). Algorithms are pure generators of
// Frames — no DOM, no timers, no randomness. The registry suite validates every
// module against this contract.

import type { CollectionId, Frame, Value } from '../engine/protocol';
import type { ViewState } from '../engine/reduce';

export type Category =
  | 'Arrays & Two Pointers'
  | 'Sorting'
  | 'Searching'
  | 'Linked List'
  | 'Stack & Queue'
  | 'Trees'
  | 'Heap'
  | 'Graphs'
  | 'Dynamic Programming'
  | 'Backtracking'
  | 'Greedy';

export type Paradigm =
  | 'Brute force'
  | 'Divide & Conquer'
  | 'Non-comparison sorting'
  | 'Linear scan'
  | 'Greedy'
  | 'Dynamic Programming'
  | 'Backtracking'
  | 'Graph theory'
  | 'Data-structure operations';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type RendererKind =
  | 'array-bars'
  | 'array-boxes'
  | 'heap-strip'
  | 'linked-list'
  | 'stack-queue'
  | 'tree'
  | 'graph'
  | 'grid';

export interface Complexity {
  time: string;
  timeWorst?: string;
  space: string;
}

export interface InputSchema {
  kind: 'int-array' | 'string' | 'graph' | 'grid' | 'tree' | 'scenario' | 'custom';
  maxVisualSize?: number;
  note?: string;
}

// Input is intentionally loose: each module knows its own shape.
export type Input = unknown;

export interface Operation {
  op: string;
  args?: Value[];
  label?: string;
}

export interface ViewSpec {
  col: CollectionId;
  as: RendererKind;
  label?: string;
}

// Static presentation hints that are not animated state (kept out of ViewState, D-11).
export interface VizConfig {
  layout?: Record<string, { x: number; y: number }>; // graph/tree node coords (0..1)
  grid?: { rows: number; cols: number };
}

export interface AlgoModule {
  meta: {
    slug: string;
    title: string;
    category: Category;
    paradigm: Paradigm[];
    difficulty: Difficulty;
    complexity: Complexity;
    explanation: string; // markdown-ish: what / when / pitfalls
    lights: string; // the "what lights up" acceptance row
  };
  code: string; // line numbers must match Frame.line (1-based)
  renderer: RendererKind;
  views?: ViewSpec[];
  viz?: VizConfig;
  input: {
    schema: InputSchema;
    default: () => Input;
    random: (seed: number) => Input;
    edges: Partial<
      Record<'empty' | 'single' | 'duplicates' | 'sorted' | 'reversed', Input>
    >;
  };
  scenario?: Operation[];
  run: (input: Input) => Generator<Frame>;
  expect: {
    result?: (input: Input) => Value | Value[];
    invariants?: ((final: ViewState) => boolean)[];
  };
}

// Deterministic seeded PRNG (mulberry32) so `random(seed)` is reproducible.
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomIntArray(seed: number, len = 8, max = 60, min = 4): number[] {
  const rng = makeRng(seed);
  return Array.from({ length: len }, () => Math.floor(rng() * (max - min + 1)) + min);
}
