import { describe, expect, it } from 'vitest';
import { emptyViewState, reduce, orderedIndices, type ViewState } from './reduce';
import { buildTimeline, collectFrames } from './timeline';
import bubble from '../algos/sorting/bubble';
import type { Frame } from './protocol';

function framesFor(input: number[]): Frame[] {
  return collectFrames(bubble.run(input)).frames;
}

function sequentialState(frames: Frame[], upto: number): ViewState {
  let s = emptyViewState();
  for (let i = 0; i <= upto; i++) s = reduce(s, frames[i]);
  return s;
}

function orderedValues(s: ViewState): number[] {
  return orderedIndices(s, 'main').map(({ id }) => s.entities[id].value as number);
}

describe('reducer + timeline', () => {
  const input = [5, 2, 8, 1, 9, 3, 7, 4];

  it('replays deterministically (same frames from same input)', () => {
    const a = framesFor(input);
    const b = framesFor(input);
    expect(JSON.stringify(a)).toEqual(JSON.stringify(b));
  });

  it('produces a sorted final state', () => {
    const frames = framesFor(input);
    const final = sequentialState(frames, frames.length - 1);
    expect(orderedValues(final)).toEqual([...input].sort((x, y) => x - y));
  });

  it('scrub-equals-play: timeline.stateAt(n) === sequential reduce to n', () => {
    const frames = framesFor(input);
    const tl = buildTimeline(frames);
    for (let n = -1; n < frames.length; n++) {
      expect(tl.stateAt(n)).toEqual(sequentialState(frames, n));
    }
  });

  it('reverse-step correctness: stepping back matches forward states', () => {
    const frames = framesFor(input);
    const tl = buildTimeline(frames);
    const forward: ViewState[] = [];
    for (let n = 0; n < frames.length; n++) forward.push(tl.stateAt(n));
    for (let n = frames.length - 1; n >= 0; n--) {
      expect(tl.stateAt(n)).toEqual(forward[n]);
    }
  });

  it('crosses checkpoint boundaries correctly on a long run', () => {
    // A reversed 30-element input generates >200 frames, forcing a checkpoint.
    const big = Array.from({ length: 30 }, (_, i) => 30 - i);
    const frames = framesFor(big);
    expect(frames.length).toBeGreaterThan(200);
    const tl = buildTimeline(frames);
    const mid = 250;
    expect(tl.stateAt(mid)).toEqual(sequentialState(frames, mid));
    const final = tl.stateAt(frames.length - 1);
    expect(orderedValues(final)).toEqual([...big].sort((x, y) => x - y));
  });
});
