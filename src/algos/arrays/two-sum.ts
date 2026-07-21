import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function twoSum(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    const sum = a[lo] + a[hi];
    if (sum === target) return [lo, hi];
    if (sum < target) lo++;
    else hi--;
  }
  return null;
}`;

interface TS { array: number[]; target: number }

function* run(input: unknown): Generator<Frame> {
  const { array, target } = input as TS;
  const m = new ArrayModel('main', array);
  yield { ops: m.setupOps(), annotate: [vars({ target })], line: 1, note: `Find two values summing to ${target}` };
  let lo = 0;
  let hi = m.length - 1;
  while (lo < hi) {
    const sum = m.valAt(lo) + m.valAt(hi);
    yield {
      annotate: [
        pointer('lo', 'main', lo),
        pointer('hi', 'main', hi),
        { an: 'flash', targets: [m.at(lo)], state: 'active' },
        { an: 'flash', targets: [m.at(hi)], state: 'compare' },
        vars({ lo, hi, sum, target }),
      ],
      line: 4,
      note: `a[${lo}] + a[${hi}] = ${sum}`,
    };
    if (sum === target) {
      yield {
        annotate: [mark(m.at(lo), 'path'), mark(m.at(hi), 'path'), vars({ result: `${lo},${hi}` })],
        line: 5,
        note: `Found pair at indices ${lo} and ${hi}`,
      };
      return;
    }
    if (sum < target) lo++;
    else hi--;
  }
  yield { line: 9, note: 'No pair found', annotate: [vars({ result: 'none' })] };
}

function reference({ array, target }: TS): string {
  let lo = 0;
  let hi = array.length - 1;
  while (lo < hi) {
    const s = array[lo] + array[hi];
    if (s === target) return `${lo},${hi}`;
    if (s < target) lo++;
    else hi--;
  }
  return 'none';
}

function randomTS(seed: number): TS {
  const rng = makeRng(seed);
  const set = new Set<number>();
  while (set.size < 8) set.add(Math.floor(rng() * 20) + 1);
  const array = [...set].sort((a, b) => a - b);
  const i = Math.floor(rng() * array.length);
  let j = Math.floor(rng() * array.length);
  if (j === i) j = (j + 1) % array.length;
  return { array, target: array[i] + array[j] };
}

const twoSum: AlgoModule = {
  meta: {
    slug: 'two-sum-sorted',
    title: 'Two Sum (sorted)',
    category: 'Arrays & Two Pointers',
    paradigm: ['Linear scan'],
    difficulty: 'easy',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** On a *sorted* array, put one pointer at each end. If the pair sums too low, move the left pointer up; too high, move the right pointer down; equal, you've found it.

**When:** The canonical two-pointer pattern — pair-sum, three-sum (with a loop outside), and "closest sum" problems.

**Pitfalls:** Requires sorted input. The pointers only ever move inward, giving O(n) — that monotonicity is what makes it correct.`,
    lights: 'lo/hi chevrons walking inward, sum readout',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'custom', maxVisualSize: 16, note: 'sorted array + target' },
    default: () => ({ array: [1, 3, 4, 5, 7, 10, 11], target: 9 }),
    random: randomTS,
    edges: { single: { array: [5], target: 5 }, sorted: { array: [1, 2, 3, 4], target: 7 } },
  },
  run,
  expect: { result: (input) => reference(input as TS) },
};

export default twoSum;
