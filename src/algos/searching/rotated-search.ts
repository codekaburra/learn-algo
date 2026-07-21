import type { Annotation, Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function search(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === target) return mid;
    if (a[lo] <= a[mid]) {                     // left half sorted
      if (a[lo] <= target && target < a[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {                                   // right half sorted
      if (a[mid] < target && target <= a[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}`;

interface RS { array: number[]; target: number }

function* run(input: unknown): Generator<Frame> {
  const { array, target } = input as RS;
  const m = new ArrayModel('main', array);
  yield { ops: m.setupOps(), annotate: [vars({ target })], line: 1, note: `Search ${target} in a rotated sorted array` };
  let lo = 0;
  let hi = m.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    yield {
      annotate: [pointer('lo', 'main', lo), pointer('hi', 'main', hi), pointer('mid', 'main', mid), { an: 'flash', targets: [m.at(mid)], state: 'active' }, vars({ lo, hi, mid, 'a[mid]': m.valAt(mid) })],
      line: 4,
      note: `mid = ${mid}, a[mid] = ${m.valAt(mid)}`,
    };
    if (m.valAt(mid) === target) {
      yield { annotate: [mark(m.at(mid), 'path'), vars({ result: mid })], line: 5, note: `Found at ${mid}` };
      return;
    }
    const leftSorted = m.valAt(lo) <= m.valAt(mid);
    const sortedFlash: Annotation[] = [];
    for (let k = leftSorted ? lo : mid; k <= (leftSorted ? mid : hi); k++) sortedFlash.push({ an: 'flash', targets: [m.at(k)], state: 'compare' });
    yield { annotate: sortedFlash, line: 6, note: `${leftSorted ? 'Left' : 'Right'} half is sorted` };

    const discard: Annotation[] = [];
    if (leftSorted) {
      if (m.valAt(lo) <= target && target < m.valAt(mid)) {
        for (let k = mid; k <= hi; k++) discard.push(mark(m.at(k), 'discard'));
        hi = mid - 1;
      } else {
        for (let k = lo; k <= mid; k++) discard.push(mark(m.at(k), 'discard'));
        lo = mid + 1;
      }
    } else {
      if (m.valAt(mid) < target && target <= m.valAt(hi)) {
        for (let k = lo; k <= mid; k++) discard.push(mark(m.at(k), 'discard'));
        lo = mid + 1;
      } else {
        for (let k = mid; k <= hi; k++) discard.push(mark(m.at(k), 'discard'));
        hi = mid - 1;
      }
    }
    yield { annotate: [...discard, vars({ lo, hi })], line: 8, note: 'Discard the half that cannot contain the target' };
  }
  yield { annotate: [vars({ result: -1 })], line: 14, note: 'Not found' };
}

function rotate(sorted: number[], by: number): number[] {
  return [...sorted.slice(by), ...sorted.slice(0, by)];
}

function randomRS(seed: number): RS {
  const rng = makeRng(seed);
  const set = new Set<number>();
  while (set.size < 8) set.add(Math.floor(rng() * 30));
  const sorted = [...set].sort((a, b) => a - b);
  const array = rotate(sorted, Math.floor(rng() * sorted.length));
  return { array, target: array[Math.floor(rng() * array.length)] };
}

const rotatedSearch: AlgoModule = {
  meta: {
    slug: 'search-rotated-sorted',
    title: 'Search in Rotated Sorted Array',
    category: 'Searching',
    paradigm: ['Divide & Conquer'],
    difficulty: 'medium',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    explanation: `**What:** A sorted array rotated at an unknown pivot still has one sorted half at every step. Detect which half is sorted, decide whether the target lies within it, and discard the other half.

**When:** Binary search when the sort order is "broken" once — rotated arrays, and finding the rotation point/minimum.

**Pitfalls:** Use \`a[lo] <= a[mid]\` (inclusive) to classify the sorted half correctly when \`lo === mid\`. The range check for the target must use the sorted half's endpoints.`,
    lights: 'sorted-half detection tint',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'custom', maxVisualSize: 18, note: 'rotated sorted array + target' },
    default: () => ({ array: [4, 5, 6, 7, 0, 1, 2], target: 0 }),
    random: randomRS,
    edges: { single: { array: [1], target: 1 }, sorted: { array: [1, 2, 3, 4, 5], target: 4 } },
  },
  run,
  expect: {
    result: (input) => {
      const { array, target } = input as RS;
      let lo = 0;
      let hi = array.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (array[mid] === target) return mid;
        if (array[lo] <= array[mid]) {
          if (array[lo] <= target && target < array[mid]) hi = mid - 1;
          else lo = mid + 1;
        } else {
          if (array[mid] < target && target <= array[hi]) lo = mid + 1;
          else hi = mid - 1;
        }
      }
      return -1;
    },
  },
};

export default rotatedSearch;
