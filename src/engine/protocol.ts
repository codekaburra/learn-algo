// The event protocol v2 — single source of truth for the animation data model.
// See ARCHITECTURE.md. Identity (EntityId) and location (Location) are separate;
// model operations mutate data, annotations are visual-only.

export type Value = number | string | boolean | null;

export type EntityId = string; // stable for the life of a run, never reused
export type CollectionId = string; // 'main', 'aux', 'bucket-3', 'stack-a', 'output'
export type NodeId = string; // tree/graph structural slots

export type Location =
  | { kind: 'index'; col: CollectionId; index: number }
  | { kind: 'node'; col: CollectionId; node: NodeId }
  | { kind: 'cell'; col: CollectionId; row: number; column: number };

export type CollectionShape =
  | 'array'
  | 'list'
  | 'stack'
  | 'queue'
  | 'tree'
  | 'graph'
  | 'grid';

export type Rel = 'next' | 'left' | 'right' | 'child' | 'edge';

export interface EdgeSpec {
  id?: string;
  directed?: boolean;
  weight?: number;
}

export type ModelOp =
  | { op: 'collection'; id: CollectionId; shape: CollectionShape; label?: string }
  | { op: 'create'; id: EntityId; value: Value; at: Location }
  | { op: 'destroy'; id: EntityId }
  | { op: 'move'; id: EntityId; to: Location }
  | { op: 'swap'; a: EntityId; b: EntityId }
  | { op: 'setValue'; id: EntityId; value: Value }
  | { op: 'link'; from: NodeId; to: NodeId; rel: Rel; edge?: EdgeSpec }
  | { op: 'unlink'; from: NodeId; to: NodeId; rel: Rel };

export type MarkState = 'sorted' | 'visited' | 'path' | 'discard';
export type FlashState = 'active' | 'compare' | 'error';

export type Annotation =
  | { an: 'mark'; target: EntityId | NodeId; state: MarkState }
  | { an: 'unmark'; target: EntityId | NodeId }
  | { an: 'flash'; targets: (EntityId | NodeId)[]; state: FlashState }
  | { an: 'edgeMark'; from: NodeId; to: NodeId; state: MarkState }
  | { an: 'edgeUnmark'; from: NodeId; to: NodeId }
  | { an: 'pointer'; name: string; at: Location | null }
  | { an: 'range'; name: string; col: CollectionId; from: number; to: number }
  | { an: 'clearRange'; name: string }
  | { an: 'vars'; values: Record<string, Value> };

export type Pace = 'normal' | 'fast' | 'hold';

export interface Frame {
  ops?: ModelOp[];
  annotate?: Annotation[];
  line?: number;
  note?: string;
  pace?: Pace;
}

// Exercise RawOps — recorded by instrumented structures, later normalized to Frames.
export type RawOp =
  | { raw: 'readAt'; at: Location }
  | { raw: 'writeAt'; at: Location; value: Value }
  | { raw: 'swapAt'; a: Location; b: Location }
  | { raw: 'compareAt'; a: Location; b: Location }
  | { raw: 'pointerAt'; name: string; at: Location | null };

// Helpers for locations.
export const idx = (col: CollectionId, index: number): Location => ({
  kind: 'index',
  col,
  index,
});
export const nodeLoc = (col: CollectionId, node: NodeId): Location => ({
  kind: 'node',
  col,
  node,
});
export const cell = (col: CollectionId, row: number, column: number): Location => ({
  kind: 'cell',
  col,
  row,
  column,
});

export function locationKey(loc: Location): string {
  switch (loc.kind) {
    case 'index':
      return `${loc.col}#${loc.index}`;
    case 'node':
      return `${loc.col}@${loc.node}`;
    case 'cell':
      return `${loc.col}!${loc.row},${loc.column}`;
  }
}
