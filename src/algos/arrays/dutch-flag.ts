import type { Frame } from '../../engine/protocol';
import { ArrayModel, pointer, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function sort012(a) {
  let lo = 0, mid = 0, hi = a.length - 1;
  while (mid <= hi) {
    if (a[mid] === 0) swap(a, lo++, mid++);
    else if (a[mid] === 2) swap(a, hi--, mid);
    else mid++;
  }
  return a;
}`;

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  yield { ops: m.setupOps(), line: 1, note: 'Three-way partition (0s, 1s, 2s)' };
  let lo = 0;
  let mid = 0;
  let hi = m.length - 1;
  while (mid <= hi) {
    yield {
      annotate: [pointer('lo', 'main', lo), pointer('mid', 'main', mid), pointer('hi', 'main', hi), { an: 'flash', targets: [m.at(mid)], state: 'active' }, vars({ lo, mid, hi, 'a[mid]': m.valAt(mid) })],
      line: 3,
      note: `a[mid] = ${m.valAt(mid)}`,
    };
    if (m.valAt(mid) === 0) {
      if (lo !== mid) yield { ops: [m.swap(lo, mid)], annotate: [{ an: 'flash', targets: [m.at(lo), m.at(mid)], state: 'active' }], line: 4, note: '0 → swap to the low region' };
      lo++;
      mid++;
    } else if (m.valAt(mid) === 2) {
      if (hi !== mid) yield { ops: [m.swap(hi, mid)], annotate: [{ an: 'flash', targets: [m.at(hi), m.at(mid)], state: 'active' }], line: 5, note: '2 → swap to the high region' };
      hi--;
    } else {
      mid++;
    }
  }
  yield { line: 7, note: 'Partitioned' };
}

function random012(seed: number): number[] {
  const rng = makeRng(seed);
  return Array.from({ length: 9 }, () => Math.floor(rng() * 3));
}

const dutchFlag: AlgoModule = {
  meta: {
    slug: 'dutch-national-flag',
    title: 'Dutch National Flag',
    category: 'Arrays & Two Pointers',
    paradigm: ['Linear scan'],
    difficulty: 'medium',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** Partition an array of three values into three regions in one pass. \`lo\` bounds the 0s, \`hi\` bounds the 2s, and \`mid\` scans; a 0 swaps down, a 2 swaps up, a 1 stays.

**When:** Three-way partitioning — sort-colors, and quicksort's 3-way partition for many duplicate keys.

**Pitfalls:** Do **not** advance \`mid\` after swapping with \`hi\`: the value pulled in from the right is unexamined.`,
    lights: 'three growing colored regions',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 18, note: 'values 0, 1, 2' },
    default: () => [2, 0, 2, 1, 1, 0, 1, 2, 0],
    random: random012,
    edges: { empty: [], single: [1], duplicates: [1, 1, 1], sorted: [0, 0, 1, 2], reversed: [2, 2, 1, 0, 0] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().sort((a, b) => a - b) },
};

export default dutchFlag;
