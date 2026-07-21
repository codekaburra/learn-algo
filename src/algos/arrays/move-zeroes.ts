import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function moveZeroes(a) {
  let slow = 0;
  for (let fast = 0; fast < a.length; fast++) {
    if (a[fast] !== 0) {
      swap(a, slow, fast);
      slow++;
    }
  }
  return a;
}`;

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  yield { ops: m.setupOps(), line: 1, note: 'Push zeroes to the end, keep order' };
  let slow = 0;
  for (let fast = 0; fast < m.length; fast++) {
    yield {
      annotate: [pointer('slow', 'main', slow), pointer('fast', 'main', fast), { an: 'flash', targets: [m.at(fast)], state: 'active' }, vars({ slow, fast, 'a[fast]': m.valAt(fast) })],
      line: 3,
      note: `Inspect a[${fast}] = ${m.valAt(fast)}`,
    };
    if (m.valAt(fast) !== 0) {
      if (slow !== fast) yield { ops: [m.swap(slow, fast)], annotate: [{ an: 'flash', targets: [m.at(slow), m.at(fast)], state: 'active' }], line: 5, note: `Non-zero → swap into slot ${slow}` };
      slow++;
    }
  }
  for (let k = 0; k < slow; k++) yield { annotate: [mark(m.at(k), 'sorted')] };
  yield { line: 9, note: 'Zeroes pushed to the end' };
}

function randomZeroes(seed: number): number[] {
  const rng = makeRng(seed);
  return Array.from({ length: 8 }, () => (rng() < 0.4 ? 0 : Math.floor(rng() * 9) + 1));
}

const moveZeroes: AlgoModule = {
  meta: {
    slug: 'move-zeroes',
    title: 'Move Zeroes',
    category: 'Arrays & Two Pointers',
    paradigm: ['Linear scan'],
    difficulty: 'easy',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** A slow pointer marks where the next non-zero belongs; a fast pointer scans ahead. Each non-zero is swapped into the slow slot, so zeroes accumulate at the end while relative order is preserved.

**When:** In-place stable partitioning ("keep these, push those to the end").

**Pitfalls:** Swapping only when \`slow !== fast\` avoids redundant self-swaps. The slow/fast pattern generalises to "remove duplicates" and "partition by predicate".`,
    lights: 'slow/fast pointers, zeroes drifting right',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 16 },
    default: () => [0, 1, 0, 3, 12, 0, 5],
    random: randomZeroes,
    edges: { empty: [], single: [0], duplicates: [0, 0, 0, 1] },
  },
  run,
  expect: {
    result: (input) => {
      const a = (input as number[]).slice();
      const res: number[] = [];
      let z = 0;
      for (const x of a) {
        if (x === 0) z++;
        else res.push(x);
      }
      while (z-- > 0) res.push(0);
      return res;
    },
  },
};

export default moveZeroes;
