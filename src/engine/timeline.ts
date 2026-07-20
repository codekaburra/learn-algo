// Pre-collects a generator's frames (bounded), reduces once, and stores snapshot
// checkpoints every CHECKPOINT_INTERVAL frames so step-back/scrub replay from the
// nearest checkpoint — never from frame 0, never via inverse ops (D-8).

import type { Frame, Pace } from './protocol';
import { emptyViewState, reduce, type ViewState } from './reduce';

export const CHECKPOINT_INTERVAL = 200;
export const MAX_FRAMES = 50_000;

export interface Timeline {
  frames: Frame[];
  truncated: boolean;
  /** state[0] = empty; stateAfter(i) = state after applying frames[0..i]. */
  stateAt(cursor: number): ViewState;
  length: number;
}

export function collectFrames(gen: Generator<Frame>): {
  frames: Frame[];
  truncated: boolean;
} {
  const frames: Frame[] = [];
  let truncated = false;
  for (const f of gen) {
    frames.push(f);
    if (frames.length >= MAX_FRAMES) {
      truncated = true;
      break;
    }
  }
  return { frames, truncated };
}

export function buildTimeline(frames: Frame[], truncated = false): Timeline {
  // checkpoints[k] = state after applying frames[0 .. k*CHECKPOINT_INTERVAL - 1].
  // checkpoints[0] is the empty initial state (cursor = -1, nothing applied).
  const checkpoints: ViewState[] = [emptyViewState()];
  let running = checkpoints[0];
  for (let i = 0; i < frames.length; i++) {
    running = reduce(running, frames[i]);
    if ((i + 1) % CHECKPOINT_INTERVAL === 0) checkpoints.push(running);
  }

  // cursor semantics: -1 = nothing applied; n = frames[0..n] applied.
  function stateAt(cursor: number): ViewState {
    if (cursor < 0) return checkpoints[0];
    const clamped = Math.min(cursor, frames.length - 1);
    const framesApplied = clamped + 1;
    const cpIndex = Math.floor(framesApplied / CHECKPOINT_INTERVAL);
    let state = checkpoints[Math.min(cpIndex, checkpoints.length - 1)];
    const startFrame = Math.min(cpIndex, checkpoints.length - 1) * CHECKPOINT_INTERVAL;
    for (let i = startFrame; i <= clamped; i++) {
      state = reduce(state, frames[i]);
    }
    return state;
  }

  return { frames, truncated, stateAt, length: frames.length };
}

export function buildTimelineFromGenerator(gen: Generator<Frame>): Timeline {
  const { frames, truncated } = collectFrames(gen);
  return buildTimeline(frames, truncated);
}

export function paceDuration(pace: Pace | undefined, baseMs: number): number {
  switch (pace) {
    case 'fast':
      return baseMs * 0.5;
    case 'hold':
      return baseMs * 1.8;
    default:
      return baseMs;
  }
}
