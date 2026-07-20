import { describe, expect, it } from 'vitest';
import { emptyViewState, reduce, type ViewState } from './reduce';
import type { Frame } from './protocol';
import type { AlgoModule } from '../algos/types';

import bubble from '../algos/sorting/bubble';
import binarySearch from '../algos/searching/binary-search';
import reverseList from '../algos/linked-list/reverse-linked-list';
import dijkstra from '../algos/graphs/dijkstra';
import nQueens from '../algos/backtracking/n-queens';

function replay(mod: AlgoModule, input: unknown): { frames: Frame[]; final: ViewState } {
  const frames = [...mod.run(input)];
  let s = emptyViewState();
  for (const f of frames) s = reduce(s, f);
  return { frames, final: s };
}

function usesOp(frames: Frame[], pred: (o: unknown) => boolean): boolean {
  return frames.some((f) => (f.ops ?? []).some(pred) || (f.annotate ?? []).some(pred));
}

describe('protocol fixtures span all five data shapes', () => {
  it('Bubble Sort — array: compare/swap/mark-sorted', () => {
    const { frames } = replay(bubble, bubble.input.default());
    expect(usesOp(frames, (o: any) => o.op === 'swap')).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'flash')).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'mark' && o.state === 'sorted')).toBe(true);
  });

  it('Binary Search — array: discard marks, range squeeze, pointers', () => {
    const { frames } = replay(binarySearch, binarySearch.input.default());
    expect(usesOp(frames, (o: any) => o.an === 'mark' && o.state === 'discard')).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'range')).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'pointer')).toBe(true);
  });

  it('Reverse Linked List — list: link/unlink, node pointers', () => {
    const { frames, final } = replay(reverseList, reverseList.input.default());
    expect(usesOp(frames, (o: any) => o.op === 'link')).toBe(true);
    expect(usesOp(frames, (o: any) => o.op === 'unlink')).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'pointer')).toBe(true);
    // node-kind locations
    expect(Object.values(final.entityLoc).every((l) => l.kind === 'node')).toBe(true);
  });

  it('Dijkstra — graph: weighted directed edges, edgeMark + edgeUnmark, vars, PQ strip', () => {
    const { frames, final } = replay(dijkstra, dijkstra.input.default());
    expect(
      usesOp(frames, (o: any) => o.op === 'link' && o.edge?.directed && typeof o.edge?.weight === 'number'),
    ).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'edgeMark')).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'edgeUnmark')).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'vars')).toBe(true);
    // multi-collection: main graph + pq strip
    expect(Object.keys(final.collections).sort()).toContain('pq');
  });

  it('N-Queens — grid: cell locations, place/remove, error flash, backtrack', () => {
    const { frames } = replay(nQueens, 6);
    expect(usesOp(frames, (o: any) => o.op === 'create' && o.at?.kind === 'cell')).toBe(true);
    expect(usesOp(frames, (o: any) => o.op === 'destroy')).toBe(true);
    expect(usesOp(frames, (o: any) => o.an === 'flash' && o.state === 'error')).toBe(true);
  });
});
