import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function linearSearch(a, target) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] === target) return i;
  }
  return -1;
}`;

interface LS { array: number[]; target: number }

function* run(input: unknown): Generator<Frame> {
  const { array, target } = input as LS;
  const m = new ArrayModel('main', array);
  yield { ops: m.setupOps(), annotate: [vars({ target })], line: 1, note: `Scan for ${target}` };
  for (let i = 0; i < m.length; i++) {
    const hit = m.valAt(i) === target;
    yield {
      annotate: [pointer('i', 'main', i), { an: 'flash', targets: [m.at(i)], state: hit ? 'active' : 'compare' }, vars({ i, 'a[i]': m.valAt(i) })],
      line: 3,
      note: `a[${i}] = ${m.valAt(i)}${hit ? ' — match!' : ''}`,
    };
    if (hit) {
      yield { annotate: [mark(m.at(i), 'path'), vars({ result: i })], line: 3, note: `Found at index ${i}` };
      return;
    }
    yield { annotate: [mark(m.at(i), 'discard')], line: 2 };
  }
  yield { annotate: [vars({ result: -1 })], line: 5, note: 'Not found' };
}

function randomLS(seed: number): LS {
  const rng = makeRng(seed);
  const array = Array.from({ length: 8 }, () => Math.floor(rng() * 20));
  return { array, target: array[Math.floor(rng() * array.length)] };
}

const linearSearch: AlgoModule = {
  meta: {
    slug: 'linear-search',
    title: 'Linear Search',
    category: 'Searching',
    paradigm: ['Brute force'],
    difficulty: 'easy',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** Walk the array left to right and return the first index whose value equals the target.

**When:** Unsorted data, tiny arrays, or one-off lookups where building an index isn't worth it.

**Pitfalls:** O(n) every time — if you query repeatedly, sort once and binary-search, or use a hash set.`,
    lights: 'cursor sweep, hit pulse',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'custom', maxVisualSize: 18, note: 'array + target' },
    default: () => ({ array: [4, 2, 7, 1, 9, 3, 8], target: 9 }),
    random: randomLS,
    edges: { single: { array: [5], target: 5 } },
  },
  run,
  expect: {
    result: (input) => {
      const { array, target } = input as LS;
      return array.indexOf(target);
    },
  },
};

export default linearSearch;
