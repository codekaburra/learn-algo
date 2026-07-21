import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function radixSort(a) {
  const max = Math.max(...a);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const count = new Array(10).fill(0);
    for (const x of a) count[digit(x, exp)]++;
    for (let d = 1; d < 10; d++) count[d] += count[d - 1];
    const out = new Array(a.length);
    for (let i = a.length - 1; i >= 0; i--)
      out[--count[digit(a[i], exp)]] = a[i];
    for (let i = 0; i < a.length; i++) a[i] = out[i];
  }
  return a;
}`;

const digit = (x: number, exp: number) => Math.floor(x / exp) % 10;

function* run(input: unknown): Generator<Frame> {
  const arr = (input as number[]).slice();
  const m = new ArrayModel('main', arr);
  const max = arr.length ? Math.max(...arr) : 0;
  const buckets = new ArrayModel('counts', new Array(10).fill(0), 'bucket');

  yield { ops: m.setupOps(), line: 1, note: 'Input integers' };
  yield { ops: buckets.setupOps('array', 'bucket sizes (digit 0–9)'), line: 4, note: 'Ten digit buckets' };

  let place = 1;
  let digitName = 'ones';
  for (let exp = 1; max === 0 ? exp === 1 : Math.floor(max / exp) > 0; exp *= 10) {
    // reset buckets
    for (let d = 0; d < 10; d++) if (buckets.valAt(d) !== 0) yield { ops: [buckets.setValueOp(d, 0)] };

    yield { annotate: [vars({ pass: place, digit: digitName })], line: 3, note: `Pass on the ${digitName} digit` };

    const count = new Array(10).fill(0);
    for (let i = 0; i < m.length; i++) {
      const d = digit(m.valAt(i), exp);
      count[d]++;
      yield {
        ops: [buckets.setValueOp(d, buckets.valAt(d) + 1)],
        annotate: [
          { an: 'flash', targets: [m.at(i)], state: 'active' },
          { an: 'flash', targets: [buckets.at(d)], state: 'compare' },
          vars({ value: m.valAt(i), digit: d }),
        ],
        line: 5,
        note: `${m.valAt(i)} → bucket ${d}`,
      };
    }
    for (let d = 1; d < 10; d++) count[d] += count[d - 1];

    const values = m.ids.map((id) => m.values[id] as number);
    const out = new Array(m.length);
    for (let i = m.length - 1; i >= 0; i--) out[--count[digit(values[i], exp)]] = values[i];

    for (let i = 0; i < m.length; i++) {
      if (m.valAt(i) !== out[i]) {
        yield {
          ops: [m.setValueOp(i, out[i])],
          annotate: [{ an: 'flash', targets: [m.at(i)], state: 'active' }],
          line: 10,
          note: `Place ${out[i]} at index ${i}`,
        };
      }
    }
    place++;
    digitName = place === 2 ? 'tens' : place === 3 ? 'hundreds' : `10^${place - 1}`;
    if (max === 0) break;
  }
  for (let k = 0; k < m.length; k++) yield { annotate: [mark(m.at(k), 'sorted')] };
  yield { line: 12, note: 'Sorted' };
}

function randomNums(seed: number): number[] {
  const rng = makeRng(seed);
  return Array.from({ length: 8 }, () => Math.floor(rng() * 900) + 10);
}

const radix: AlgoModule = {
  meta: {
    slug: 'radix-sort',
    title: 'Radix Sort (LSD)',
    category: 'Sorting',
    paradigm: ['Non-comparison sorting'],
    difficulty: 'medium',
    complexity: { time: 'O(d·(n + b))', space: 'O(n + b)' },
    explanation: `**What:** Sort integers digit by digit, least-significant first, using a *stable* counting sort on each digit. After the last digit the array is fully sorted.

**When:** Fixed-width integer or string keys where the number of digits \`d\` is small.

**Pitfalls:** The per-digit sort **must** be stable or earlier passes are undone. \`b\` is the base (10 here). Total cost O(d·(n+b)) only beats comparison sorts when d is small.`,
    lights: 'digit-of-focus highlighted, bucket redistribution',
  },
  code,
  renderer: 'array-bars',
  views: [
    { col: 'main', as: 'array-bars' },
    { col: 'counts', as: 'array-boxes', label: 'bucket sizes (digit 0–9)' },
  ],
  input: {
    schema: { kind: 'int-array', maxVisualSize: 16, note: 'non-negative integers' },
    default: () => [170, 45, 75, 90, 2, 802, 24, 66],
    random: randomNums,
    edges: { empty: [], single: [7], duplicates: [11, 11, 22, 22], sorted: [1, 2, 3, 4], reversed: [40, 30, 20, 10] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().sort((a, b) => a - b) },
};

export default radix;
