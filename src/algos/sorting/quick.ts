import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, range, vars } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function quickSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const p = partition(a, lo, hi);
  quickSort(a, lo, p - 1);
  quickSort(a, p + 1, hi);
}
function partition(a, lo, hi) {
  const pivot = a[hi];
  let i = lo;
  for (let j = lo; j < hi; j++) {
    if (a[j] < pivot) { swap(a, i, j); i++; }
  }
  swap(a, i, hi);
  return i;
}`;

function* partition(m: ArrayModel, lo: number, hi: number): Generator<Frame, number> {
  const pivotVal = m.valAt(hi);
  yield {
    annotate: [
      range('window', 'main', lo, hi),
      pointer('pivot', 'main', hi),
      { an: 'flash', targets: [m.at(hi)], state: 'compare' },
      vars({ lo, hi, pivot: pivotVal }),
    ],
    line: 8,
    note: `Pivot = a[${hi}] = ${pivotVal}`,
  };
  let i = lo;
  for (let j = lo; j < hi; j++) {
    yield {
      annotate: [pointer('i', 'main', i), pointer('j', 'main', j), { an: 'flash', targets: [m.at(j)], state: 'active' }, vars({ i, j })],
      line: 11,
      note: `Compare a[${j}]=${m.valAt(j)} with pivot ${pivotVal}`,
    };
    if (m.valAt(j) < pivotVal) {
      if (i !== j) yield { ops: [m.swap(i, j)], annotate: [{ an: 'flash', targets: [m.at(i), m.at(j)], state: 'active' }], line: 11, note: `a[${j}] < pivot → swap into position ${i}` };
      i++;
    }
  }
  yield { ops: [m.swap(i, hi)], annotate: [{ an: 'flash', targets: [m.at(i), m.at(hi)], state: 'active' }], line: 13, note: `Move pivot to its final index ${i}` };
  yield { annotate: [mark(m.at(i), 'sorted')], line: 14, note: `Index ${i} is finalized` };
  return i;
}

function* quickSort(m: ArrayModel, lo: number, hi: number): Generator<Frame> {
  if (lo >= hi) {
    if (lo === hi) yield { annotate: [mark(m.at(lo), 'sorted')], line: 2 };
    return;
  }
  const p = yield* partition(m, lo, hi);
  yield* quickSort(m, lo, p - 1);
  yield* quickSort(m, p + 1, hi);
}

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  yield { ops: m.setupOps(), line: 1, note: 'Unsorted array' };
  yield* quickSort(m, 0, m.length - 1);
  yield { annotate: [{ an: 'clearRange', name: 'window' }], line: 5, note: 'Sorted' };
}

const quick: AlgoModule = {
  meta: {
    slug: 'quick-sort',
    title: 'Quick Sort',
    category: 'Sorting',
    paradigm: ['Divide & Conquer'],
    difficulty: 'medium',
    complexity: { time: 'O(n log n)', timeWorst: 'O(n²)', space: 'O(log n)' },
    explanation: `**What:** Pick a pivot, partition the array so smaller elements go left and larger go right, then recurse on each side. This uses the Lomuto scheme with the last element as pivot.

**When:** The default in-place sort in many libraries — excellent average-case constant factors and cache behaviour.

**Pitfalls:** Worst case O(n²) on already-sorted input with a naive pivot; randomised or median-of-three pivots avoid it. Not stable.`,
    lights: 'pivot glows, partition pointers, subrange brackets',
  },
  code,
  renderer: 'array-bars',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 24 },
    default: () => [5, 2, 8, 1, 9, 3, 7, 4],
    random: (seed) => randomIntArray(seed, 8),
    edges: { empty: [], single: [42], duplicates: [4, 4, 4, 2, 2], sorted: [1, 2, 3, 4, 5], reversed: [6, 5, 4, 3, 2, 1] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().sort((a, b) => a - b) },
};

export default quick;
