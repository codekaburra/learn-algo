// Per-algorithm progress in localStorage (no accounts, D-4).

import { useSyncExternalStore } from 'react';

export type ProgressState = 'none' | 'viewed' | 'understood';

const KEY = 'algolab.progress.v1';

function read(): Record<string, ProgressState> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

const listeners = new Set<() => void>();
let cache = typeof localStorage !== 'undefined' ? read() : {};

function emit() {
  cache = read();
  listeners.forEach((l) => l());
}

export function setProgress(slug: string, state: ProgressState) {
  const all = read();
  if (state === 'none') delete all[slug];
  else all[slug] = state;
  localStorage.setItem(KEY, JSON.stringify(all));
  emit();
}

export function getProgress(slug: string): ProgressState {
  return cache[slug] ?? 'none';
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useProgress(slug: string): ProgressState {
  return useSyncExternalStore(
    subscribe,
    () => cache[slug] ?? 'none',
    () => 'none',
  );
}

export function useAllProgress(): Record<string, ProgressState> {
  return useSyncExternalStore(
    subscribe,
    () => cache,
    () => ({}),
  );
}
