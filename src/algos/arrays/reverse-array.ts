import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function reverse(a) {
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    swap(a, lo, hi);
    lo++;
    hi--;
  }
  return a;
}`;

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  yield { ops: m.setupOps(), line: 1, note: 'Reverse in place with two pointers' };
  let lo = 0;
  let hi = m.length - 1;
  while (lo < hi) {
    yield {
      annotate: [pointer('lo', 'main', lo), pointer('hi', 'main', hi), { an: 'flash', targets: [m.at(lo), m.at(hi)], state: 'active' }],
      line: 3,
      note: `Swap ends: index ${lo} ↔ ${hi}`,
    };
    yield { ops: [m.swap(lo, hi)], annotate: [{ an: 'flash', targets: [m.at(lo), m.at(hi)], state: 'active' }], line: 4, note: 'swap' };
    yield { annotate: [mark(m.at(lo), 'sorted'), mark(m.at(hi), 'sorted')], line: 5 };
    lo++;
    hi--;
  }
  if (lo === hi) yield { annotate: [mark(m.at(lo), 'sorted')], line: 7, note: 'Middle element stays put' };
  yield { line: 8, note: 'Reversed' };
}

const reverseArray: AlgoModule = {
  meta: {
    slug: 'reverse-array',
    title: 'Reverse Array In-Place',
    category: 'Arrays & Two Pointers',
    paradigm: ['Linear scan'],
    difficulty: 'easy',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** Swap the outermost pair, then move both pointers inward, until they meet.

**When:** Any in-place reversal; a subroutine in array rotation (reverse-reverse-reverse) and palindrome construction.

**Pitfalls:** Loop while \`lo < hi\` — a middle element in an odd-length array needs no swap.`,
    lights: 'mirrored swaps meeting in the middle',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 16 },
    default: () => [1, 2, 3, 4, 5, 6, 7],
    random: (seed) => randomIntArray(seed, 7),
    edges: { empty: [], single: [42], sorted: [1, 2, 3, 4], duplicates: [2, 2, 5, 5] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().reverse() },
};

export default reverseArray;
