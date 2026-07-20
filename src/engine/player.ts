// Playback state machine (zustand). The player only moves a cursor over the frame
// list; a rAF clock advances the cursor once the current frame's animation duration
// (pace × speed) has elapsed, so transitions finish before the next beat at any speed.

import { create } from 'zustand';
import type { Frame } from './protocol';
import {
  buildTimeline,
  paceDuration,
  type Timeline,
} from './timeline';
import { emptyViewState, type ViewState } from './reduce';

const BASE_FRAME_MS = 700; // duration of a "normal" beat at 1×

export const SPEEDS = [0.25, 0.5, 1, 2, 4] as const;
export type Speed = (typeof SPEEDS)[number];

interface PlayerState {
  timeline: Timeline | null;
  cursor: number; // -1 = nothing applied
  playing: boolean;
  speed: Speed;
  view: ViewState;
  truncated: boolean;

  load: (frames: Frame[], truncated?: boolean) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (cursor: number) => void;
  restart: () => void;
  setSpeed: (s: Speed) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
}

let rafId: number | null = null;
let lastBeat = 0;

export const usePlayer = create<PlayerState>((set, get) => {
  function stopClock() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function tick(now: number) {
    const { playing, timeline, cursor, speed } = get();
    if (!playing || !timeline) {
      stopClock();
      return;
    }
    const frame = timeline.frames[cursor + 1];
    const dur = paceDuration(frame?.pace, BASE_FRAME_MS) / speed;
    if (now - lastBeat >= dur) {
      lastBeat = now;
      const nextCursor = cursor + 1;
      if (nextCursor >= timeline.length - 1) {
        set({ cursor: nextCursor, view: timeline.stateAt(nextCursor), playing: false });
        stopClock();
        return;
      }
      set({ cursor: nextCursor, view: timeline.stateAt(nextCursor) });
    }
    rafId = requestAnimationFrame(tick);
  }

  function startClock() {
    stopClock();
    lastBeat = performance.now() - BASE_FRAME_MS; // advance first beat promptly
    rafId = requestAnimationFrame(tick);
  }

  return {
    timeline: null,
    cursor: -1,
    playing: false,
    speed: 1,
    view: emptyViewState(),
    truncated: false,
    reducedMotion:
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,

    load: (frames, truncated = false) => {
      stopClock();
      const timeline = buildTimeline(frames, truncated);
      set({
        timeline,
        cursor: -1,
        playing: false,
        truncated: timeline.truncated,
        view: timeline.stateAt(-1),
      });
    },

    play: () => {
      const { timeline, cursor } = get();
      if (!timeline || timeline.length === 0) return;
      // If at the end, restart from the beginning.
      if (cursor >= timeline.length - 1) {
        set({ cursor: -1, view: timeline.stateAt(-1) });
      }
      set({ playing: true });
      startClock();
    },

    pause: () => {
      stopClock();
      set({ playing: false });
    },

    toggle: () => {
      if (get().playing) get().pause();
      else get().play();
    },

    next: () => {
      const { timeline, cursor } = get();
      if (!timeline) return;
      const n = Math.min(cursor + 1, timeline.length - 1);
      set({ cursor: n, view: timeline.stateAt(n), playing: false });
      stopClock();
    },

    prev: () => {
      const { timeline, cursor } = get();
      if (!timeline) return;
      const n = Math.max(cursor - 1, -1);
      set({ cursor: n, view: timeline.stateAt(n), playing: false });
      stopClock();
    },

    seek: (cursor) => {
      const { timeline } = get();
      if (!timeline) return;
      const n = Math.max(-1, Math.min(cursor, timeline.length - 1));
      set({ cursor: n, view: timeline.stateAt(n) });
    },

    restart: () => {
      const { timeline } = get();
      if (!timeline) return;
      stopClock();
      set({ cursor: -1, view: timeline.stateAt(-1), playing: false });
    },

    setSpeed: (s) => set({ speed: s }),
    setReducedMotion: (v) => set({ reducedMotion: v }),
  };
});
