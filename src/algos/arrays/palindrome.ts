import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function isPalindrome(s) {
  let lo = 0, hi = s.length - 1;
  while (lo < hi) {
    if (s[lo] !== s[hi]) return false;
    lo++;
    hi--;
  }
  return true;
}`;

function* run(input: unknown): Generator<Frame> {
  const s = input as string;
  const m = new ArrayModel('main', s.split(''));
  yield { ops: m.setupOps(), line: 1, note: `Is "${s}" a palindrome?` };
  let lo = 0;
  let hi = m.length - 1;
  while (lo < hi) {
    const match = m.valAt(lo) === m.valAt(hi);
    yield {
      annotate: [
        pointer('lo', 'main', lo),
        pointer('hi', 'main', hi),
        { an: 'flash', targets: [m.at(lo), m.at(hi)], state: match ? 'active' : 'error' },
        vars({ lo, hi, 's[lo]': m.valAt(lo), 's[hi]': m.valAt(hi) }),
      ],
      line: 4,
      note: match ? `'${m.valAt(lo)}' = '${m.valAt(hi)}'` : `'${m.valAt(lo)}' ≠ '${m.valAt(hi)}' — not a palindrome`,
    };
    if (!match) {
      yield { annotate: [vars({ result: false })], line: 4, note: 'Return false' };
      return;
    }
    yield { annotate: [mark(m.at(lo), 'sorted'), mark(m.at(hi), 'sorted')], line: 5 };
    lo++;
    hi--;
  }
  if (lo === hi) yield { annotate: [mark(m.at(lo), 'sorted')], line: 7 };
  yield { annotate: [vars({ result: true })], line: 7, note: 'It is a palindrome' };
}

function randomStr(seed: number): string {
  const rng = makeRng(seed);
  const half = Array.from({ length: 3 }, () => 'abcde'[Math.floor(rng() * 5)]);
  const mkPal = rng() > 0.5;
  const s = mkPal ? [...half, ...[...half].reverse()] : Array.from({ length: 6 }, () => 'abcde'[Math.floor(rng() * 5)]);
  return s.join('');
}

const palindrome: AlgoModule = {
  meta: {
    slug: 'valid-palindrome',
    title: 'Valid Palindrome',
    category: 'Arrays & Two Pointers',
    paradigm: ['Linear scan'],
    difficulty: 'easy',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** Compare characters from both ends moving inward. Any mismatch means it is not a palindrome.

**When:** String symmetry checks; the two-pointer template for "compare from both ends".

**Pitfalls:** Real-world variants strip non-alphanumerics and lowercase first. A mismatch should short-circuit immediately.`,
    lights: 'matching char pairs pulse green / mismatch shows error state',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'string', maxVisualSize: 16 },
    default: () => 'racecar',
    random: randomStr,
    edges: { single: 'a', duplicates: 'aaaa' },
  },
  run,
  expect: {
    result: (input) => {
      const s = input as string;
      for (let i = 0, j = s.length - 1; i < j; i++, j--) if (s[i] !== s[j]) return false;
      return true;
    },
  },
};

export default palindrome;
