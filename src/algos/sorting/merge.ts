import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, range, vars } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function mergeSort(a, lo = 0, hi = a.length - 1) {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  mergeSort(a, lo, mid);
  mergeSort(a, mid + 1, hi);
  merge(a, lo, mid, hi);
}
function merge(a, lo, mid, hi) {
  const tmp = [];
  let i = lo, j = mid + 1;
  while (i <= mid && j <= hi)
    tmp.push(a[i] <= a[j] ? a[i++] : a[j++]);
  while (i <= mid) tmp.push(a[i++]);
  while (j <= hi) tmp.push(a[j++]);
  for (let k = 0; k < tmp.length; k++) a[lo + k] = tmp[k];
}`;

function* mergeSort(m: ArrayModel, lo: number, hi: number): Generator<Frame> {
  if (lo >= hi) return;
  const mid = (lo + hi) >> 1;
  yield {
    annotate: [range('window', 'main', lo, hi), vars({ lo, mid, hi })],
    line: 3,
    note: `Split [${lo}..${hi}] at ${mid}`,
  };
  yield* mergeSort(m, lo, mid);
  yield* mergeSort(m, mid + 1, hi);

  // merge
  const tmp: number[] = [];
  let i = lo;
  let j = mid + 1;
  yield {
    annotate: [range('window', 'main', lo, hi), vars({ merging: `[${lo}..${mid}] + [${mid + 1}..${hi}]` })],
    line: 8,
    note: `Merge the two sorted halves`,
  };
  while (i <= mid && j <= hi) {
    yield {
      annotate: [{ an: 'flash', targets: [m.at(i)], state: 'active' }, { an: 'flash', targets: [m.at(j)], state: 'compare' }],
      line: 12,
      note: `Compare a[${i}]=${m.valAt(i)} and a[${j}]=${m.valAt(j)}`,
    };
    if (m.valAt(i) <= m.valAt(j)) tmp.push(m.valAt(i++));
    else tmp.push(m.valAt(j++));
  }
  while (i <= mid) tmp.push(m.valAt(i++));
  while (j <= hi) tmp.push(m.valAt(j++));

  for (let k = 0; k < tmp.length; k++) {
    yield {
      ops: [m.setValueOp(lo + k, tmp[k])],
      annotate: [{ an: 'flash', targets: [m.at(lo + k)], state: 'active' }],
      line: 15,
      note: `Write ${tmp[k]} back to index ${lo + k}`,
    };
  }
}

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  yield { ops: m.setupOps(), line: 1, note: 'Unsorted array' };
  yield* mergeSort(m, 0, m.length - 1);
  for (let k = 0; k < m.length; k++) yield { annotate: [mark(m.at(k), 'sorted')] };
  yield { annotate: [{ an: 'clearRange', name: 'window' }], line: 6, note: 'Sorted' };
}

const merge: AlgoModule = {
  meta: {
    slug: 'merge-sort',
    title: 'Merge Sort',
    category: 'Sorting',
    paradigm: ['Divide & Conquer'],
    difficulty: 'medium',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
    explanation: `**What:** Divide the array in half, sort each half recursively, then merge the two sorted halves by repeatedly taking the smaller front element.

**When:** A reliable O(n log n) sort, stable, and the standard choice for linked lists and external sorting.

**Pitfalls:** Needs O(n) auxiliary space for the merge. The \`<=\` in the merge comparison (not \`<\`) is what keeps it stable.`,
    lights: 'halves split apart, merge zip animation',
  },
  code,
  renderer: 'array-bars',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 24 },
    default: () => [5, 2, 8, 1, 9, 3, 7, 4],
    random: (seed) => randomIntArray(seed, 8),
    edges: { empty: [], single: [42], duplicates: [4, 2, 4, 2, 4], sorted: [1, 2, 3, 4], reversed: [6, 5, 4, 3, 2, 1] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().sort((a, b) => a - b) },
};

export default merge;
