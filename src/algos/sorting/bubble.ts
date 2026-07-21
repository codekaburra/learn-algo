import type { Frame } from '../../engine/protocol';
import { orderedIndices } from '../../engine/reduce';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function bubbleSort(a) {
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (a[j] > a[j + 1]) {
        swap(a, j, j + 1);
      }
    }
    // a[n-1-i] is now in its final place
  }
  return a;
}`;

function* run(input: unknown): Generator<Frame> {
  const arr = (input as number[]).slice();
  const m = new ArrayModel('main', arr);
  const n = m.length;

  yield { ops: m.setupOps('array'), line: 2, note: 'Start with the unsorted array' };

  if (n === 0) {
    yield { line: 11, note: 'Empty array — already sorted' };
    return;
  }

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      const a = m.at(j);
      const b = m.at(j + 1);
      yield {
        annotate: [
          pointer('i', 'main', n - 1 - i),
          pointer('j', 'main', j),
          { an: 'flash', targets: [a], state: 'active' },
          { an: 'flash', targets: [b], state: 'compare' },
          vars({ i, j, 'a[j]': m.valAt(j), 'a[j+1]': m.valAt(j + 1) }),
        ],
        line: 5,
        note: `Compare a[${j}]=${m.valAt(j)} and a[${j + 1}]=${m.valAt(j + 1)}`,
      };
      if (m.valAt(j) > m.valAt(j + 1)) {
        const swapOp = m.swap(j, j + 1);
        yield {
          ops: [swapOp],
          annotate: [
            { an: 'flash', targets: [a, b], state: 'active' },
          ],
          line: 6,
          note: `a[${j}] > a[${j + 1}] → swap`,
          pace: 'normal',
        };
      }
    }
    yield {
      annotate: [mark(m.at(n - 1 - i), 'sorted')],
      line: 9,
      note: `a[${n - 1 - i}] is now in its final place`,
    };
  }
  yield {
    annotate: [mark(m.at(0), 'sorted')],
    line: 11,
    note: 'Array fully sorted',
  };
}

const bubble: AlgoModule = {
  meta: {
    slug: 'bubble-sort',
    title: 'Bubble Sort',
    category: 'Sorting',
    paradigm: ['Brute force'],
    difficulty: 'easy',
    complexity: { time: 'O(n²)', space: 'O(1)' },
    explanation: `**What:** Repeatedly step through the list, comparing adjacent pairs and swapping them if they are in the wrong order. After each full pass the largest remaining element "bubbles" to its final position.

**When:** Almost never in practice — it is a teaching algorithm. Its value is how visible the comparison/swap mechanic is.

**Pitfalls:** O(n²) comparisons make it unusable on large inputs. The common "optimization" is a swapped flag to stop early once a pass makes no swaps.`,
    lights: 'adjacent compare pair, swap arcs, sorted tail turns green',
  },
  code,
  renderer: 'array-bars',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 30 },
    default: () => [5, 2, 8, 1, 9, 3, 7, 4],
    random: (seed) => randomIntArray(seed, 8),
    edges: {
      empty: [],
      single: [42],
      duplicates: [4, 4, 2, 2, 4, 2],
      sorted: [1, 2, 3, 4, 5],
      reversed: [5, 4, 3, 2, 1],
    },
  },
  run,
  expect: {
    result: (input) => (input as number[]).slice().sort((a, b) => a - b),
    invariants: [
      (final) => {
        const vals = orderedIndices(final, 'main').map(
          ({ id }) => final.entities[id].value as number,
        );
        for (let i = 1; i < vals.length; i++) if (vals[i] < vals[i - 1]) return false;
        return true;
      },
    ],
  },
};

export default bubble;
