import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function maxSubArray(a) {
  let best = a[0], cur = a[0], start = 0, bLo = 0, bHi = 0;
  for (let i = 1; i < a.length; i++) {
    if (cur + a[i] < a[i]) { cur = a[i]; start = i; }
    else cur += a[i];
    if (cur > best) { best = cur; bLo = start; bHi = i; }
  }
  return best;
}`;

function* run(input: unknown): Generator<Frame> {
  const arr = (input as number[]).slice();
  const m = new ArrayModel('main', arr);
  yield { ops: m.setupOps(), line: 1, note: 'Maximum contiguous subarray sum (Kadane)' };
  if (arr.length === 0) {
    yield { line: 8, note: 'Empty', annotate: [vars({ result: 0 })] };
    return;
  }
  let best = arr[0];
  let cur = arr[0];
  let start = 0;
  let bLo = 0;
  let bHi = 0;
  for (let i = 1; i < arr.length; i++) {
    yield {
      annotate: [pointer('i', 'main', i), { an: 'flash', targets: [m.at(i)], state: 'active' }, vars({ i, cur, best })],
      line: 3,
      note: `Extend or restart at a[${i}] = ${arr[i]}`,
    };
    if (cur + arr[i] < arr[i]) {
      cur = arr[i];
      start = i;
      yield { annotate: [vars({ cur, start })], line: 4, note: `Restart window at ${i}` };
    } else {
      cur += arr[i];
      yield { annotate: [vars({ cur })], line: 5, note: `cur = ${cur}` };
    }
    if (cur > best) {
      best = cur;
      bLo = start;
      bHi = i;
      const marks = [];
      for (let k = bLo; k <= bHi; k++) marks.push(mark(m.at(k), 'path'));
      yield { annotate: [...marks, vars({ best, range: `[${bLo}..${bHi}]` })], line: 6, note: `New best = ${best}` };
    }
  }
  const finalMarks = [];
  for (let k = 0; k < arr.length; k++) finalMarks.push(k >= bLo && k <= bHi ? mark(m.at(k), 'path') : mark(m.at(k), 'discard'));
  yield { annotate: [...finalMarks, vars({ result: best })], line: 8, note: `Max subarray sum = ${best}` };
}

function randomKadane(seed: number): number[] {
  const rng = makeRng(seed);
  return Array.from({ length: 8 }, () => Math.floor(rng() * 19) - 9);
}

const kadane: AlgoModule = {
  meta: {
    slug: 'kadane-max-subarray',
    title: "Kadane's Max Subarray",
    category: 'Arrays & Two Pointers',
    paradigm: ['Dynamic Programming'],
    difficulty: 'medium',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** Track the best subarray sum ending at each position: either extend the previous window or start fresh at the current element. The running max of those is the answer.

**When:** The 1-D "max sum / best streak" DP; a stepping stone to max-product and 2-D variants.

**Pitfalls:** Initialise with the first element, not 0, or all-negative arrays return a wrong 0. Restart when \`cur + a[i] < a[i]\`.`,
    lights: 'running sum meter, best range trail in yellow',
  },
  code,
  renderer: 'array-bars',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 20, note: 'may include negatives' },
    default: () => [-2, 1, -3, 4, -1, 2, 1, -5, 4],
    random: randomKadane,
    edges: { single: [5], duplicates: [-1, -1, -1], sorted: [1, 2, 3, 4] },
  },
  run,
  expect: {
    result: (input) => {
      const a = input as number[];
      if (a.length === 0) return 0;
      let best = a[0];
      let cur = a[0];
      for (let i = 1; i < a.length; i++) {
        cur = Math.max(a[i], cur + a[i]);
        best = Math.max(best, cur);
      }
      return best;
    },
  },
};

export default kadane;
