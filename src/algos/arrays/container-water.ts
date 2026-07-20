import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, range, vars } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function maxArea(h) {
  let lo = 0, hi = h.length - 1, best = 0;
  while (lo < hi) {
    const area = Math.min(h[lo], h[hi]) * (hi - lo);
    best = Math.max(best, area);
    if (h[lo] < h[hi]) lo++;
    else hi--;
  }
  return best;
}`;

function* run(input: unknown): Generator<Frame> {
  const m = new ArrayModel('main', (input as number[]).slice());
  yield { ops: m.setupOps(), line: 1, note: 'Maximise water trapped between two lines' };
  let lo = 0;
  let hi = m.length - 1;
  let best = 0;
  let bestLo = 0;
  let bestHi = m.length - 1;
  while (lo < hi) {
    const area = Math.min(m.valAt(lo), m.valAt(hi)) * (hi - lo);
    if (area > best) {
      best = area;
      bestLo = lo;
      bestHi = hi;
    }
    yield {
      annotate: [
        pointer('lo', 'main', lo),
        pointer('hi', 'main', hi),
        range('water', 'main', lo, hi),
        { an: 'flash', targets: [m.at(lo), m.at(hi)], state: 'active' },
        vars({ lo, hi, area, best }),
      ],
      line: 5,
      note: `area = min(${m.valAt(lo)}, ${m.valAt(hi)}) × ${hi - lo} = ${area}`,
    };
    if (m.valAt(lo) < m.valAt(hi)) lo++;
    else hi--;
  }
  yield {
    annotate: [range('water', 'main', bestLo, bestHi), mark(m.at(bestLo), 'path'), mark(m.at(bestHi), 'path'), vars({ result: best })],
    line: 9,
    note: `Maximum area = ${best}`,
  };
}

const container: AlgoModule = {
  meta: {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    category: 'Arrays & Two Pointers',
    paradigm: ['Greedy', 'Linear scan'],
    difficulty: 'medium',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** Two pointers at the ends form a container. Its area is limited by the shorter line, so always move the shorter pointer inward — moving the taller one could only shrink the width without lifting the limiting height.

**When:** The "greedy two-pointer on width vs height" trade-off.

**Pitfalls:** Moving the taller line is always wrong — that greedy argument is the whole proof of correctness.`,
    lights: 'water area fills between bars, best-so-far ghost',
  },
  code,
  renderer: 'array-bars',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 20 },
    default: () => [1, 8, 6, 2, 5, 4, 8, 3, 7],
    random: (seed) => randomIntArray(seed, 9, 12, 1),
    edges: { single: [5], duplicates: [4, 4, 4, 4], sorted: [1, 2, 3, 4, 5] },
  },
  run,
  expect: {
    result: (input) => {
      const h = input as number[];
      let lo = 0;
      let hi = h.length - 1;
      let best = 0;
      while (lo < hi) {
        best = Math.max(best, Math.min(h[lo], h[hi]) * (hi - lo));
        if (h[lo] < h[hi]) lo++;
        else hi--;
      }
      return best;
    },
  },
};

export default container;
