import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, range, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function binarySearch(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === target) return mid;
    if (a[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}`;

interface BSInput {
  array: number[];
  target: number;
}

function* run(input: unknown): Generator<Frame> {
  const { array, target } = input as BSInput;
  const m = new ArrayModel('main', array);
  yield {
    ops: m.setupOps('array'),
    annotate: [vars({ target })],
    line: 1,
    note: `Search for ${target} in a sorted array`,
  };

  let lo = 0;
  let hi = m.length - 1;
  yield {
    annotate: [
      pointer('lo', 'main', lo),
      pointer('hi', 'main', hi),
      range('window', 'main', lo, hi),
      vars({ lo, hi }),
    ],
    line: 2,
    note: 'Initialise lo and hi to the array bounds',
  };

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    yield {
      annotate: [
        pointer('mid', 'main', mid),
        { an: 'flash', targets: [m.at(mid)], state: 'active' },
        vars({ lo, hi, mid, 'a[mid]': m.valAt(mid) }),
      ],
      line: 4,
      note: `mid = ${mid}, a[mid] = ${m.valAt(mid)}`,
    };
    if (m.valAt(mid) === target) {
      yield {
        annotate: [mark(m.at(mid), 'path'), vars({ result: mid })],
        line: 5,
        note: `Found ${target} at index ${mid}`,
      };
      return;
    }
    if (m.valAt(mid) < target) {
      const discards = [];
      for (let k = lo; k <= mid; k++) discards.push(mark(m.at(k), 'discard'));
      lo = mid + 1;
      yield {
        annotate: [
          ...discards,
          pointer('lo', 'main', lo),
          range('window', 'main', lo, hi),
          vars({ lo, hi }),
        ],
        line: 6,
        note: `a[mid] < ${target} → discard left half, lo = ${lo}`,
      };
    } else {
      const discards = [];
      for (let k = mid; k <= hi; k++) discards.push(mark(m.at(k), 'discard'));
      hi = mid - 1;
      yield {
        annotate: [
          ...discards,
          pointer('hi', 'main', hi),
          range('window', 'main', lo, hi),
          vars({ lo, hi }),
        ],
        line: 7,
        note: `a[mid] > ${target} → discard right half, hi = ${hi}`,
      };
    }
  }
  yield { line: 9, note: `${target} not present`, annotate: [vars({ result: -1 })] };
}

function sortedRandom(seed: number): BSInput {
  const rng = makeRng(seed);
  const set = new Set<number>();
  while (set.size < 9) set.add(Math.floor(rng() * 40) + 1);
  const array = [...set].sort((a, b) => a - b);
  const target = array[Math.floor(rng() * array.length)];
  return { array, target };
}

const binarySearch: AlgoModule = {
  meta: {
    slug: 'binary-search',
    title: 'Binary Search',
    category: 'Searching',
    paradigm: ['Divide & Conquer'],
    difficulty: 'easy',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    explanation: `**What:** On a *sorted* array, repeatedly halve the search window: look at the middle element, then discard the half that cannot contain the target.

**When:** Any lookup on sorted data, and as a building block for "search on the answer" problems.

**Pitfalls:** The array must be sorted. Integer overflow in \`(lo + hi) / 2\` (use \`lo + (hi - lo) / 2\`), and off-by-one errors in the \`lo\`/\`hi\` updates are the classic bugs.`,
    lights: 'discarded half dims, mid glows',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'custom', maxVisualSize: 20, note: 'sorted array + target' },
    default: () => ({ array: [1, 3, 5, 7, 9, 11, 13, 15, 17], target: 13 }),
    random: sortedRandom,
    edges: {
      single: { array: [7], target: 7 },
      sorted: { array: [2, 4, 6, 8, 10], target: 10 },
      duplicates: { array: [2, 2, 2, 5, 5, 9], target: 5 },
    },
  },
  run,
  expect: {
    result: (input) => {
      // Reference binary search — must return the same index the generator reports.
      const { array, target } = input as BSInput;
      let lo = 0;
      let hi = array.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (array[mid] === target) return mid;
        if (array[mid] < target) lo = mid + 1;
        else hi = mid - 1;
      }
      return -1;
    },
  },
};

export default binarySearch;
