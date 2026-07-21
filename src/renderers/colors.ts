import type { ViewState } from '../engine/reduce';

export interface Visual {
  fill: string;
  glow: boolean;
  outline?: string;
  dim?: boolean;
  error?: boolean;
}

// Resolve an entity's visual state. Priority: transient flash > persistent mark > idle.
export function entityVisual(state: ViewState, id: string): Visual {
  const flash = state.flashes[id];
  if (flash === 'active') return { fill: 'var(--el-active)', glow: true };
  if (flash === 'compare') return { fill: 'var(--el-compare)', glow: true };
  if (flash === 'error') return { fill: 'var(--el-error)', glow: true, error: true };

  const mark = state.marks[id];
  if (mark === 'sorted') return { fill: 'var(--el-sorted)', glow: false };
  if (mark === 'visited') return { fill: 'var(--el-visited)', glow: false, dim: true };
  if (mark === 'discard') return { fill: 'var(--el-discard)', glow: false, dim: true };
  if (mark === 'path')
    return { fill: 'var(--el-path)', glow: true, outline: 'var(--el-path)' };

  return { fill: 'color-mix(in srgb, var(--accent) 60%, #1b2036)', glow: false };
}

export function edgeVisual(state: ViewState, from: string, to: string): {
  stroke: string;
  width: number;
  glow: boolean;
} {
  const mark = state.edgeMarks[`${from}->${to}`] ?? state.edgeMarks[`${to}->${from}`];
  if (mark === 'path') return { stroke: 'var(--el-path)', width: 3.5, glow: true };
  if (mark === 'visited') return { stroke: 'var(--el-visited)', width: 2.5, glow: false };
  return { stroke: 'var(--glass-border)', width: 1.5, glow: false };
}
