import type { Frame } from '../../engine/protocol';
import { cell } from '../../engine/protocol';
import { vars } from '../helpers';
import type { AlgoModule } from '../types';

const code = `function solve(n) {
  const cols = [];
  function place(r) {
    if (r === n) return true;
    for (let c = 0; c < n; c++) {
      if (safe(r, c, cols)) {
        cols[r] = c;              // place queen
        if (place(r + 1)) return true;
        cols[r] = -1;             // backtrack
      }
    }
    return false;
  }
  return place(0);
}`;

function conflict(cols: number[], r: number, c: number): number {
  // Returns the conflicting row, or -1 if safe.
  for (let pr = 0; pr < r; pr++) {
    const pc = cols[pr];
    if (pc === c || Math.abs(pc - c) === Math.abs(pr - r)) return pr;
  }
  return -1;
}

function* place(n: number, r: number, cols: number[]): Generator<Frame, boolean> {
  if (r === n) {
    yield { line: 4, note: 'All rows filled — solution found', annotate: [vars({ result: 'solved' })] };
    return true;
  }
  for (let c = 0; c < n; c++) {
    const bad = conflict(cols, r, c);
    yield {
      annotate: [
        { an: 'flash', targets: [`cell-${r}-${c}`], state: 'compare' },
        vars({ row: r, col: c }),
      ],
      line: 6,
      note: `Try row ${r}, column ${c}`,
    };
    if (bad !== -1) {
      yield {
        annotate: [{ an: 'flash', targets: [`q-${bad}`, `cell-${r}-${c}`], state: 'error' }],
        line: 6,
        note: `Conflict with the queen in row ${bad}`,
      };
      continue;
    }
    cols[r] = c;
    yield {
      ops: [{ op: 'create', id: `q-${r}`, value: '♛', at: cell('main', r, c) }],
      annotate: [{ an: 'mark', target: `q-${r}`, state: 'path' }],
      line: 7,
      note: `Place queen at (${r}, ${c})`,
    };
    const solved = yield* place(n, r + 1, cols);
    if (solved) return true;
    cols[r] = -1;
    yield {
      ops: [{ op: 'destroy', id: `q-${r}` }],
      line: 9,
      note: `Dead end — remove queen from row ${r} and backtrack`,
    };
  }
  return false;
}

function* run(input: unknown): Generator<Frame> {
  const n = input as number;
  yield {
    ops: [{ op: 'collection', id: 'main', shape: 'grid' }],
    line: 1,
    note: `Place ${n} non-attacking queens on a ${n}×${n} board`,
  };
  const solved = yield* place(n, 0, []);
  if (!solved) {
    yield { line: 12, note: 'No solution exists', annotate: [vars({ result: 'no solution' })] };
  }
}

const nQueens: AlgoModule = {
  meta: {
    slug: 'n-queens',
    title: 'N-Queens',
    category: 'Backtracking',
    paradigm: ['Backtracking'],
    difficulty: 'medium',
    complexity: { time: 'O(n!)', space: 'O(n)' },
    explanation: `**What:** Place queens one row at a time. For each row try every column; if a column is safe (no queen shares its column or diagonal), place and recurse. If a row has no safe column, undo the previous placement and try the next option — *backtracking*.

**When:** The canonical constraint-satisfaction / exhaustive-search pattern (also subsets, permutations, sudoku).

**Pitfalls:** The diagonal check \`|pc - c| === |pr - r|\` catches both diagonals. Remember to undo state on backtrack, or later branches inherit stale placements.`,
    lights: 'queens place, conflicts flash error state, backtrack rewinds',
  },
  code,
  renderer: 'grid',
  viz: { grid: { rows: 6, cols: 6 } },
  input: {
    schema: { kind: 'custom', maxVisualSize: 8, note: 'board size n' },
    default: () => 6,
    random: () => 6,
    edges: { single: 1 },
  },
  run,
  expect: {
    result: (input) => {
      const n = input as number;
      return n === 2 || n === 3 ? 'no solution' : 'solved';
    },
  },
};

export default nQueens;
