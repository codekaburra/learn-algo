import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function selectionSort(a) {
  const n = a.length;
  for (let i = 0; i < n; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) swap(a, i, min);
    // a[i] is now finalized
  }
  return a;
}`;

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  const n = m.length;
  yield { ops: m.setupOps(), line: 2, note: 'Unsorted array' };

  for (let i = 0; i < n; i++) {
    let min = i;
    yield {
      annotate: [pointer('i', 'main', i), pointer('min', 'main', min), vars({ i, min })],
      line: 4,
      note: `Assume a[${i}] is the minimum of the rest`,
    };
    for (let j = i + 1; j < n; j++) {
      yield {
        annotate: [
          pointer('j', 'main', j),
          { an: 'flash', targets: [m.at(j)], state: 'active' },
          { an: 'flash', targets: [m.at(min)], state: 'compare' },
          vars({ i, j, min, 'a[j]': m.valAt(j), 'a[min]': m.valAt(min) }),
        ],
        line: 6,
        note: `Compare a[${j}] with current min a[${min}]`,
      };
      if (m.valAt(j) < m.valAt(min)) {
        min = j;
        yield {
          annotate: [pointer('min', 'main', min), vars({ min })],
          line: 6,
          note: `New minimum at index ${min}`,
        };
      }
    }
    if (min !== i) {
      yield {
        ops: [m.swap(i, min)],
        annotate: [{ an: 'flash', targets: [m.at(i), m.at(min)], state: 'active' }],
        line: 8,
        note: `Swap the minimum into position ${i}`,
      };
    }
    yield { annotate: [mark(m.at(i), 'sorted')], line: 9, note: `a[${i}] is finalized` };
  }
  yield { line: 11, note: 'Sorted' };
}

const selection: AlgoModule = {
  meta: {
    slug: 'selection-sort',
    title: 'Selection Sort',
    category: 'Sorting',
    paradigm: ['Brute force'],
    difficulty: 'easy',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    explanation: `**What:** Repeatedly select the smallest element from the unsorted suffix and swap it into the next sorted position. Exactly one swap per pass.

**When:** When writes are expensive and you want to minimise them (≤ n swaps total). Otherwise insertion sort usually wins.

**Pitfalls:** Always O(n²) comparisons — it does not adapt to nearly-sorted input. Not stable in its basic swap form.`,
    lights: 'scanning cursor, current-min highlight, one swap per pass',
  },
  code,
  renderer: 'array-bars',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 30 },
    default: () => [5, 2, 8, 1, 9, 3, 7, 4],
    random: (seed) => randomIntArray(seed, 8),
    edges: { empty: [], single: [42], duplicates: [4, 4, 2, 2, 4], sorted: [1, 2, 3, 4], reversed: [5, 4, 3, 2, 1] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().sort((a, b) => a - b) },
};

export default selection;
