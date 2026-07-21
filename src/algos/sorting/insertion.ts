import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    let j = i;
    while (j > 0 && a[j - 1] > a[j]) {
      swap(a, j - 1, j);
      j--;
    }
  }
  return a;
}`;

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  const n = m.length;
  yield { ops: m.setupOps(), line: 1, note: 'Unsorted array' };
  if (n > 0) yield { annotate: [mark(m.at(0), 'sorted')], line: 2, note: 'First element is trivially sorted' };

  for (let i = 1; i < n; i++) {
    let j = i;
    yield {
      annotate: [pointer('i', 'main', i), { an: 'flash', targets: [m.at(i)], state: 'active' }, vars({ i })],
      line: 3,
      note: `Insert a[${i}] into the sorted prefix`,
    };
    while (j > 0 && m.valAt(j - 1) > m.valAt(j)) {
      yield {
        annotate: [
          pointer('j', 'main', j),
          { an: 'flash', targets: [m.at(j - 1)], state: 'compare' },
          { an: 'flash', targets: [m.at(j)], state: 'active' },
          vars({ j, 'a[j-1]': m.valAt(j - 1), 'a[j]': m.valAt(j) }),
        ],
        line: 4,
        note: `a[${j - 1}] > a[${j}] → shift left`,
      };
      yield {
        ops: [m.swap(j - 1, j)],
        annotate: [{ an: 'flash', targets: [m.at(j - 1), m.at(j)], state: 'active' }],
        line: 5,
        note: 'Swap the key one step left',
      };
      j--;
    }
  }
  for (let k = 0; k < n; k++) yield { annotate: [mark(m.at(k), 'sorted')] };
  yield { line: 9, note: 'Sorted' };
}

const insertion: AlgoModule = {
  meta: {
    slug: 'insertion-sort',
    title: 'Insertion Sort',
    category: 'Sorting',
    paradigm: ['Brute force'],
    difficulty: 'easy',
    complexity: { time: 'O(n²)', timeWorst: 'O(n²)', space: 'O(1)' },
    explanation: `**What:** Grow a sorted prefix one element at a time. Take the next element and slide it left past every larger element until it lands in place.

**When:** Excellent for small or nearly-sorted arrays — it runs in O(n) on already-sorted input and is stable. Often the base case inside quicksort/merge sort.

**Pitfalls:** Still O(n²) worst case (reversed input). The naive version shifts by copying; here we visualise it as adjacent swaps.`,
    lights: 'lifted element floats, slides left over shifting bars',
  },
  code,
  renderer: 'array-bars',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 30 },
    default: () => [5, 2, 8, 1, 9, 3, 7, 4],
    random: (seed) => randomIntArray(seed, 8),
    edges: { empty: [], single: [42], duplicates: [3, 1, 3, 1, 3], sorted: [1, 2, 3, 4], reversed: [5, 4, 3, 2, 1] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().sort((a, b) => a - b) },
};

export default insertion;
