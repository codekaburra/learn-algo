import type { Frame } from '../../engine/protocol';
import { ArrayModel, range, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function prefixSum(a) {
  const p = [0];
  for (let i = 0; i < a.length; i++)
    p[i + 1] = p[i] + a[i];
  return p; // rangeSum(l, r) = p[r + 1] - p[l]
}`;

interface PSInput {
  array: number[];
  queries: [number, number][];
}

function* run(input: unknown): Generator<Frame> {
  const { array, queries } = input as PSInput;
  const m = new ArrayModel('main', array);
  const p = new ArrayModel('prefix', new Array(array.length + 1).fill(0), 'prefix');

  yield { ops: m.setupOps(), line: 1, note: 'Build a prefix-sum array for O(1) range queries' };
  yield { ops: p.setupOps('array', 'prefix p[]'), line: 2, note: 'p[0] = 0' };

  for (let i = 0; i < array.length; i++) {
    yield {
      ops: [p.setValueOp(i + 1, p.valAt(i) + m.valAt(i))],
      annotate: [{ an: 'flash', targets: [m.at(i)], state: 'active' }, { an: 'flash', targets: [p.at(i + 1)], state: 'compare' }, vars({ i, 'p[i+1]': p.valAt(i) + m.valAt(i) })],
      line: 4,
      note: `p[${i + 1}] = p[${i}] + a[${i}] = ${p.valAt(i) + m.valAt(i)}`,
    };
  }

  const answers: number[] = [];
  for (const [l, r] of queries) {
    const ans = p.valAt(r + 1) - p.valAt(l);
    answers.push(ans);
    yield {
      annotate: [
        range('query', 'main', l, r),
        { an: 'flash', targets: [p.at(r + 1)], state: 'active' },
        { an: 'flash', targets: [p.at(l)], state: 'compare' },
        vars({ l, r, sum: ans }),
      ],
      line: 5,
      note: `rangeSum(${l}, ${r}) = p[${r + 1}] − p[${l}] = ${ans}`,
    };
  }
  yield { annotate: [vars({ result: answers.join(',') })], line: 5, note: `Answers: ${answers.join(', ')}` };
}

function randomPS(seed: number): PSInput {
  const rng = makeRng(seed);
  const array = Array.from({ length: 7 }, () => Math.floor(rng() * 9) + 1);
  const queries: [number, number][] = [
    [1, 3],
    [0, 6],
    [2, 5],
  ];
  return { array, queries };
}

const prefixSum: AlgoModule = {
  meta: {
    slug: 'prefix-sum',
    title: 'Prefix Sum + Range Query',
    category: 'Arrays & Two Pointers',
    paradigm: ['Dynamic Programming'],
    difficulty: 'easy',
    complexity: { time: 'O(n) build, O(1) query', space: 'O(n)' },
    explanation: `**What:** Precompute cumulative sums so any range sum is a single subtraction: \`rangeSum(l, r) = p[r+1] − p[l]\`.

**When:** Many range-sum queries on a static array; the 1-D basis for 2-D prefix sums, difference arrays, and subarray-sum-equals-k.

**Pitfalls:** Use the size-(n+1) convention with \`p[0] = 0\` to avoid off-by-one pain at the boundaries.`,
    lights: 'prefix array building, range = two-value subtraction',
  },
  code,
  renderer: 'array-boxes',
  views: [
    { col: 'main', as: 'array-boxes' },
    { col: 'prefix', as: 'array-boxes', label: 'prefix p[]' },
  ],
  scenario: [
    { op: 'build' },
    { op: 'query', args: [1, 3] },
    { op: 'query', args: [0, 6] },
    { op: 'query', args: [2, 5] },
  ],
  input: {
    schema: { kind: 'scenario', maxVisualSize: 16, note: 'array + range queries' },
    default: () => ({ array: [3, 1, 4, 1, 5, 9, 2], queries: [[1, 3], [0, 6], [2, 5]] }),
    random: randomPS,
    edges: { single: { array: [7], queries: [[0, 0]] } },
  },
  run,
  expect: {
    result: (input) => {
      const { array, queries } = input as PSInput;
      const p = [0];
      for (let i = 0; i < array.length; i++) p[i + 1] = p[i] + array[i];
      return queries.map(([l, r]) => p[r + 1] - p[l]).join(',');
    },
  },
};

export default prefixSum;
