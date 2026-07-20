import type { Frame } from '../../engine/protocol';
import { ArrayModel, DynamicStrip, mark, range, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function maxSlidingWindow(a, k) {
  const dq = [];   // indices, values decreasing
  const res = [];
  for (let i = 0; i < a.length; i++) {
    while (dq.length && a[dq[dq.length - 1]] <= a[i]) dq.pop();
    dq.push(i);
    if (dq[0] <= i - k) dq.shift();
    if (i >= k - 1) res.push(a[dq[0]]);
  }
  return res;
}`;

interface SWInput {
  array: number[];
  k: number;
}

function* run(input: unknown): Generator<Frame> {
  const { array, k } = input as SWInput;
  const m = new ArrayModel('main', array);
  const dqStrip = new DynamicStrip('deque');
  yield { ops: [...m.setupOps(), ...dqStrip.setupOps('deque (values)')], annotate: [vars({ k })], line: 1, note: `Maximum of every window of size ${k}` };

  const dq: number[] = [];
  const res: number[] = [];
  const dqVals = () => dq.map((i) => m.valAt(i));

  for (let i = 0; i < m.length; i++) {
    yield {
      annotate: [range('window', 'main', Math.max(0, i - k + 1), i), { an: 'flash', targets: [m.at(i)], state: 'active' }, vars({ i, 'a[i]': m.valAt(i) })],
      line: 4,
      note: `Consider a[${i}] = ${m.valAt(i)}`,
    };
    while (dq.length && m.valAt(dq[dq.length - 1]) <= m.valAt(i)) {
      const popped = dq.pop()!;
      yield { ops: dqStrip.syncOps(dqVals()), annotate: [{ an: 'flash', targets: [m.at(popped)], state: 'error' }], line: 5, note: `Pop ${m.valAt(popped)} — smaller than incoming` };
    }
    dq.push(i);
    yield { ops: dqStrip.syncOps(dqVals()), line: 6, note: `Push index ${i}` };
    if (dq[0] <= i - k) {
      dq.shift();
      yield { ops: dqStrip.syncOps(dqVals()), line: 7, note: 'Front left the window — drop it' };
    }
    if (i >= k - 1) {
      res.push(m.valAt(dq[0]));
      yield { annotate: [mark(m.at(dq[0]), 'path'), vars({ windowMax: m.valAt(dq[0]), res: res.join(',') })], line: 8, note: `Window max = ${m.valAt(dq[0])}` };
      yield { annotate: [{ an: 'unmark', target: m.at(dq[0]) }] };
    }
  }
  yield { annotate: [{ an: 'clearRange', name: 'window' }, vars({ result: res.join(',') })], line: 10, note: `Maxima: ${res.join(', ')}` };
}

function randomSW(seed: number): SWInput {
  const rng = makeRng(seed);
  return { array: Array.from({ length: 8 }, () => Math.floor(rng() * 12) + 1), k: 3 };
}

const slidingWindowMax: AlgoModule = {
  meta: {
    slug: 'sliding-window-maximum',
    title: 'Sliding Window Maximum',
    category: 'Arrays & Two Pointers',
    paradigm: ['Linear scan'],
    difficulty: 'hard',
    complexity: { time: 'O(n)', space: 'O(k)' },
    explanation: `**What:** A monotonic (decreasing) deque of indices keeps the current window's maximum at its front. Before pushing a new index, pop all smaller values from the back — they can never be a maximum while the newcomer is present.

**When:** Range-max/min over a sliding window in O(n); a template for "monotonic deque" problems.

**Pitfalls:** Store indices (not values) so you can tell when the front has slid out of the window. Each index is pushed and popped once → amortised O(n).`,
    lights: 'window bracket sliding, deque shown beneath',
  },
  code,
  renderer: 'array-boxes',
  views: [
    { col: 'main', as: 'array-boxes' },
    { col: 'deque', as: 'array-boxes', label: 'monotonic deque' },
  ],
  input: {
    schema: { kind: 'scenario', maxVisualSize: 16, note: 'array + window size k' },
    default: () => ({ array: [1, 3, -1, -3, 5, 3, 6, 7], k: 3 }),
    random: randomSW,
    edges: { single: { array: [4], k: 1 } },
  },
  run,
  expect: {
    result: (input) => {
      const { array, k } = input as SWInput;
      const dq: number[] = [];
      const res: number[] = [];
      for (let i = 0; i < array.length; i++) {
        while (dq.length && array[dq[dq.length - 1]] <= array[i]) dq.pop();
        dq.push(i);
        if (dq[0] <= i - k) dq.shift();
        if (i >= k - 1) res.push(array[dq[0]]);
      }
      return res.join(',');
    },
  },
};

export default slidingWindowMax;
