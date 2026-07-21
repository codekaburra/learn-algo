import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function countingSort(a) {
  const max = Math.max(...a);
  const count = new Array(max + 1).fill(0);
  for (const x of a) count[x]++;
  let idx = 0;
  for (let v = 0; v <= max; v++)
    while (count[v]-- > 0) a[idx++] = v;
  return a;
}`;

function* run(input: unknown): Generator<Frame> {
  const arr = (input as number[]).slice();
  const m = new ArrayModel('main', arr);
  const max = arr.length ? Math.max(...arr) : 0;
  const counts = new ArrayModel('counts', new Array(max + 1).fill(0), 'counts');

  yield { ops: m.setupOps(), line: 1, note: 'Input (small non-negative integers)' };
  yield { ops: counts.setupOps('array', 'counts[value]'), line: 3, note: `Zeroed count array of size ${max + 1}` };

  for (let i = 0; i < m.length; i++) {
    const v = m.valAt(i);
    yield {
      ops: [counts.setValueOp(v, counts.valAt(v) + 1)],
      annotate: [
        pointer('x', 'main', i),
        { an: 'flash', targets: [m.at(i)], state: 'active' },
        { an: 'flash', targets: [counts.at(v)], state: 'compare' },
        vars({ x: v }),
      ],
      line: 4,
      note: `Tally value ${v}`,
    };
  }

  let idx = 0;
  for (let v = 0; v <= max; v++) {
    while (counts.valAt(v) > 0) {
      yield {
        ops: [m.setValueOp(idx, v), counts.setValueOp(v, counts.valAt(v) - 1)],
        annotate: [
          { an: 'flash', targets: [counts.at(v)], state: 'active' },
          { an: 'flash', targets: [m.at(idx)], state: 'active' },
          mark(m.at(idx), 'sorted'),
          vars({ v, idx }),
        ],
        line: 7,
        note: `Write ${v} to output index ${idx}`,
      };
      idx++;
    }
  }
  yield { line: 8, note: 'Sorted' };
}

function randomSmall(seed: number): number[] {
  const rng = makeRng(seed);
  return Array.from({ length: 9 }, () => Math.floor(rng() * 9));
}

const counting: AlgoModule = {
  meta: {
    slug: 'counting-sort',
    title: 'Counting Sort',
    category: 'Sorting',
    paradigm: ['Non-comparison sorting'],
    difficulty: 'medium',
    complexity: { time: 'O(n + k)', space: 'O(k)' },
    explanation: `**What:** Instead of comparing elements, count how many times each value occurs, then write values back in order. \`k\` is the value range.

**When:** Small integer keys with a bounded range (ages, digits, letters). It beats O(n log n) when k = O(n).

**Pitfalls:** Space and time depend on the value range k, not just n — useless for large or sparse ranges. The prefix-sum variant is what makes it stable and lets it serve as radix sort's inner pass.`,
    lights: 'counts filling a second array, stable write-back',
  },
  code,
  renderer: 'array-bars',
  views: [
    { col: 'main', as: 'array-bars' },
    { col: 'counts', as: 'array-boxes', label: 'counts[value]' },
  ],
  input: {
    schema: { kind: 'int-array', maxVisualSize: 20, note: 'small non-negative integers' },
    default: () => [4, 2, 2, 8, 3, 3, 1, 4, 0],
    random: randomSmall,
    edges: { empty: [], single: [5], duplicates: [3, 3, 3, 3], sorted: [0, 1, 2, 3], reversed: [5, 4, 3, 2, 1] },
  },
  run,
  expect: { result: (input) => (input as number[]).slice().sort((a, b) => a - b) },
};

export default counting;
