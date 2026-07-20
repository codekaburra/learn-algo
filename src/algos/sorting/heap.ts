import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, vars } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function heapSort(a) {
  const n = a.length;
  for (let i = (n >> 1) - 1; i >= 0; i--) siftDown(a, i, n);
  for (let end = n - 1; end > 0; end--) {
    swap(a, 0, end);
    siftDown(a, 0, end);
  }
  return a;
}
function siftDown(a, i, n) {
  while (2 * i + 1 < n) {
    let c = 2 * i + 1;
    if (c + 1 < n && a[c + 1] > a[c]) c++;
    if (a[i] >= a[c]) break;
    swap(a, i, c);
    i = c;
  }
}`;

function* siftDown(m: ArrayModel, i: number, n: number): Generator<Frame> {
  while (2 * i + 1 < n) {
    let c = 2 * i + 1;
    yield {
      annotate: [{ an: 'flash', targets: [m.at(i)], state: 'active' }, vars({ node: i, child: c })],
      line: 12,
      note: `Sift down from index ${i}`,
    };
    if (c + 1 < n && m.valAt(c + 1) > m.valAt(c)) c++;
    yield {
      annotate: [{ an: 'flash', targets: [m.at(i)], state: 'active' }, { an: 'flash', targets: [m.at(c)], state: 'compare' }],
      line: 14,
      note: `Larger child is a[${c}] = ${m.valAt(c)}`,
    };
    if (m.valAt(i) >= m.valAt(c)) break;
    yield { ops: [m.swap(i, c)], annotate: [{ an: 'flash', targets: [m.at(i), m.at(c)], state: 'active' }], line: 16, note: `Swap parent with larger child` };
    i = c;
  }
}

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  const n = m.length;
  yield { ops: m.setupOps(), line: 1, note: 'Unsorted array — viewed as a binary tree' };

  for (let i = (n >> 1) - 1; i >= 0; i--) yield* siftDown(m, i, n);
  yield { line: 3, note: 'Max-heap built: largest element is at the root' };

  for (let end = n - 1; end > 0; end--) {
    yield { ops: [m.swap(0, end)], annotate: [{ an: 'flash', targets: [m.at(0), m.at(end)], state: 'active' }], line: 5, note: `Move current max to index ${end}` };
    yield { annotate: [mark(m.at(end), 'sorted')], line: 5, note: `Index ${end} finalized` };
    yield* siftDown(m, 0, end);
  }
  if (n > 0) yield { annotate: [mark(m.at(0), 'sorted')], line: 8, note: 'Sorted' };
}

const heap: AlgoModule = {
  meta: {
    slug: 'heap-sort',
    title: 'Heap Sort',
    category: 'Sorting',
    paradigm: ['Data-structure operations'],
    difficulty: 'medium',
    complexity: { time: 'O(n log n)', space: 'O(1)' },
    explanation: `**What:** Build a max-heap in place, then repeatedly swap the root (the maximum) to the end of the unsorted region and sift the new root down to restore the heap.

**When:** When you need guaranteed O(n log n) *and* O(1) extra space — heap sort has no bad inputs like quicksort does.

**Pitfalls:** Poor cache locality makes it slower than quicksort in practice. Not stable. The array *is* the tree: children of \`i\` are \`2i+1\` and \`2i+2\`.`,
    lights: 'sift-down bubbling in mirrored tree strip',
  },
  code,
  renderer: 'array-bars',
  views: [
    { col: 'main', as: 'array-bars' },
    { col: 'main', as: 'heap-strip', label: 'heap (complete binary tree)' },
  ],
  input: {
    schema: { kind: 'int-array', maxVisualSize: 24 },
    default: () => [5, 2, 8, 1, 9, 3, 7],
    random: (seed) => randomIntArray(seed, 7),
    edges: { empty: [], single: [42], duplicates: [4, 4, 2, 2, 4], sorted: [1, 2, 3, 4, 5], reversed: [6, 5, 4, 3, 2, 1] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().sort((a, b) => a - b) },
};

export default heap;
