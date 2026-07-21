import type { Annotation, Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, range, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function firstLast(a, t) {
  return [bound(a, t, true), bound(a, t, false)];
}
function bound(a, t, findFirst) {
  let lo = 0, hi = a.length - 1, ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (a[mid] === t) {
      ans = mid;
      if (findFirst) hi = mid - 1; else lo = mid + 1;
    } else if (a[mid] < t) lo = mid + 1;
    else hi = mid - 1;
  }
  return ans;
}`;

interface FL { array: number[]; target: number }

function* bound(m: ArrayModel, target: number, findFirst: boolean): Generator<Frame, number> {
  let lo = 0;
  let hi = m.length - 1;
  let ans = -1;
  yield {
    annotate: [range('window', 'main', lo, hi), vars({ finding: findFirst ? 'first' : 'last' })],
    line: 5,
    note: `Search for the ${findFirst ? 'first' : 'last'} occurrence of ${target}`,
  };
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    yield {
      annotate: [pointer('lo', 'main', lo), pointer('hi', 'main', hi), pointer('mid', 'main', mid), { an: 'flash', targets: [m.at(mid)], state: 'active' }, vars({ lo, hi, mid })],
      line: 7,
      note: `mid = ${mid}, a[mid] = ${m.valAt(mid)}`,
    };
    if (m.valAt(mid) === target) {
      ans = mid;
      if (findFirst) hi = mid - 1;
      else lo = mid + 1;
      yield { annotate: [range('window', 'main', lo, Math.max(lo, hi)), vars({ ans })], line: 9, note: `Match — keep squeezing to the ${findFirst ? 'left' : 'right'}` };
    } else if (m.valAt(mid) < target) {
      const d: Annotation[] = [];
      for (let k = lo; k <= mid; k++) d.push(mark(m.at(k), 'discard'));
      lo = mid + 1;
      yield { annotate: [...d, range('window', 'main', lo, hi), vars({ lo })], line: 11, note: 'Too small → go right' };
    } else {
      const d: Annotation[] = [];
      for (let k = mid; k <= hi; k++) d.push(mark(m.at(k), 'discard'));
      hi = mid - 1;
      yield { annotate: [...d, range('window', 'main', lo, hi), vars({ hi })], line: 12, note: 'Too big → go left' };
    }
  }
  return ans;
}

function* run(input: unknown): Generator<Frame> {
  const { array, target } = input as FL;
  const m = new ArrayModel('main', array);
  yield { ops: m.setupOps(), annotate: [vars({ target })], line: 1, note: `Find first and last index of ${target}` };

  const first = yield* bound(m, target, true);
  // clear discard marks before the second pass
  const clear: Annotation[] = m.ids.map((id) => ({ an: 'unmark', target: id }));
  yield { annotate: [...clear], line: 2, note: 'Reset for the second search' };
  const last = yield* bound(m, target, false);

  const finalMarks: Annotation[] = [];
  if (first !== -1) for (let k = first; k <= last; k++) finalMarks.push(mark(m.at(k), 'path'));
  yield { annotate: [...finalMarks, { an: 'clearRange', name: 'window' }, vars({ result: `${first},${last}` })], line: 2, note: `Range: [${first}, ${last}]` };
}

function randomFL(seed: number): FL {
  const rng = makeRng(seed);
  const array = Array.from({ length: 10 }, () => Math.floor(rng() * 5)).sort((a, b) => a - b);
  return { array, target: array[Math.floor(rng() * array.length)] };
}

const firstLast: AlgoModule = {
  meta: {
    slug: 'first-last-occurrence',
    title: 'First & Last Occurrence',
    category: 'Searching',
    paradigm: ['Divide & Conquer'],
    difficulty: 'medium',
    complexity: { time: 'O(log n)', space: 'O(1)' },
    explanation: `**What:** Two binary searches on a sorted array with duplicates. On a match, instead of returning, keep shrinking toward the left (for first) or right (for last) to find the boundary.

**When:** Counting occurrences (\`last − first + 1\`) and finding insertion ranges.

**Pitfalls:** Record \`ans\` before continuing to shrink; the naive binary search stops at *any* match, not the boundary.`,
    lights: 'boundary squeeze animation',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'custom', maxVisualSize: 18, note: 'sorted array + target' },
    default: () => ({ array: [1, 2, 2, 2, 3, 4, 4, 5], target: 2 }),
    random: randomFL,
    edges: { single: { array: [3], target: 3 }, duplicates: { array: [4, 4, 4, 4], target: 4 } },
  },
  run,
  expect: {
    result: (input) => {
      const { array, target } = input as FL;
      const first = array.indexOf(target);
      const last = array.lastIndexOf(target);
      return `${first},${last}`;
    },
  },
};

export default firstLast;
