import type { Frame } from '../../engine/protocol';
import { ArrayModel, mark, pointer, range, vars } from '../helpers';
import { makeRng, type AlgoModule } from '../types';

const code = `function lengthOfLongest(s) {
  const seen = new Set();
  let lo = 0, best = 0;
  for (let hi = 0; hi < s.length; hi++) {
    while (seen.has(s[hi])) {
      seen.delete(s[lo]);
      lo++;
    }
    seen.add(s[hi]);
    best = Math.max(best, hi - lo + 1);
  }
  return best;
}`;

function* run(input: unknown): Generator<Frame> {
  const s = input as string;
  const m = new ArrayModel('main', s.split(''));
  yield { ops: m.setupOps(), line: 1, note: 'Longest substring without repeating characters' };
  const seen = new Set<string>();
  let lo = 0;
  let best = 0;
  let bLo = 0;
  let bHi = 0;
  for (let hi = 0; hi < m.length; hi++) {
    const ch = m.valAt(hi) as unknown as string;
    yield {
      annotate: [pointer('hi', 'main', hi), { an: 'flash', targets: [m.at(hi)], state: 'active' }, vars({ hi, char: ch })],
      line: 4,
      note: `Extend window to '${ch}'`,
    };
    while (seen.has(ch)) {
      yield {
        annotate: [pointer('lo', 'main', lo), { an: 'flash', targets: [m.at(lo)], state: 'error' }, vars({ lo, removing: m.valAt(lo) })],
        line: 6,
        note: `Duplicate '${ch}' → shrink from the left`,
      };
      seen.delete(m.valAt(lo) as unknown as string);
      lo++;
    }
    seen.add(ch);
    const len = hi - lo + 1;
    if (len > best) {
      best = len;
      bLo = lo;
      bHi = hi;
    }
    yield {
      annotate: [pointer('lo', 'main', lo), range('window', 'main', lo, hi), vars({ lo, hi, len, best })],
      line: 10,
      note: `Window [${lo}..${hi}] length ${len}, best ${best}`,
    };
  }
  const marks = [];
  for (let k = bLo; k <= bHi; k++) marks.push(mark(m.at(k), 'path'));
  yield { annotate: [...marks, range('window', 'main', bLo, bHi), vars({ result: best })], line: 12, note: `Longest = ${best}` };
}

function randomStr(seed: number): string {
  const rng = makeRng(seed);
  return Array.from({ length: 8 }, () => 'abcabd'[Math.floor(rng() * 6)]).join('');
}

const longestSubstring: AlgoModule = {
  meta: {
    slug: 'longest-substring',
    title: 'Longest Substring Without Repeating',
    category: 'Arrays & Two Pointers',
    paradigm: ['Linear scan'],
    difficulty: 'medium',
    complexity: { time: 'O(n)', space: 'O(min(n, alphabet))' },
    explanation: `**What:** A sliding window holds a run of distinct characters. Grow it on the right; when the new character duplicates one inside, shrink from the left until it's unique again. Track the largest window seen.

**When:** The canonical variable-size sliding window over strings/arrays with a "no duplicates / at most k distinct" constraint.

**Pitfalls:** Shrink *before* adding the new character, and remove the left characters from the set as \`lo\` advances.`,
    lights: 'window grows/shrinks, duplicate flash',
  },
  code,
  renderer: 'array-boxes',
  input: {
    schema: { kind: 'string', maxVisualSize: 16 },
    default: () => 'abcabcbb',
    random: randomStr,
    edges: { single: 'a', duplicates: 'bbbb' },
  },
  run,
  expect: {
    result: (input) => {
      const s = input as string;
      const seen = new Set<string>();
      let lo = 0;
      let best = 0;
      for (let hi = 0; hi < s.length; hi++) {
        while (seen.has(s[hi])) {
          seen.delete(s[lo]);
          lo++;
        }
        seen.add(s[hi]);
        best = Math.max(best, hi - lo + 1);
      }
      return best;
    },
  },
};

export default longestSubstring;
