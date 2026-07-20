// Pure reducer: folds Frames into a ViewState. No DOM, no mutation of inputs.
// Renderers are pure functions of ViewState. See ARCHITECTURE.md.

import type {
  Annotation,
  CollectionId,
  CollectionShape,
  EdgeSpec,
  EntityId,
  FlashState,
  Frame,
  Location,
  MarkState,
  ModelOp,
  Value,
} from './protocol';
import { locationKey } from './protocol';

export interface CollectionState {
  shape: CollectionShape;
  label?: string;
}

export interface EdgeState {
  from: string;
  to: string;
  rel: string;
  edge?: EdgeSpec;
}

export interface RangeState {
  col: CollectionId;
  from: number;
  to: number;
}

export interface ViewState {
  collections: Record<CollectionId, CollectionState>;
  entities: Record<EntityId, { value: Value }>;
  entityLoc: Record<EntityId, Location>;
  occupancy: Record<string, EntityId>; // locationKey -> entityId
  marks: Record<string, MarkState>; // entity/node -> mark
  flashes: Record<string, FlashState>; // transient, cleared each frame
  edges: Record<string, EdgeState>; // `from|rel|to` -> edge
  edgeMarks: Record<string, MarkState>; // `from->to` -> mark
  pointers: Record<string, Location | null>;
  ranges: Record<string, RangeState>;
  vars: Record<string, Value>;
  line?: number;
  note?: string;
}

export function emptyViewState(): ViewState {
  return {
    collections: {},
    entities: {},
    entityLoc: {},
    occupancy: {},
    marks: {},
    flashes: {},
    edges: {},
    edgeMarks: {},
    pointers: {},
    ranges: {},
    vars: {},
    line: undefined,
    note: undefined,
  };
}

const edgeKey = (from: string, rel: string, to: string) => `${from}|${rel}|${to}`;
const edgeMarkKey = (from: string, to: string) => `${from}->${to}`;

// Shallow-clone every map so the previous state (which may be a stored checkpoint)
// is never mutated. Values are replaced, never mutated in place.
function clone(s: ViewState): ViewState {
  return {
    collections: { ...s.collections },
    entities: { ...s.entities },
    entityLoc: { ...s.entityLoc },
    occupancy: { ...s.occupancy },
    marks: { ...s.marks },
    flashes: {}, // flashes auto-clear each frame
    edges: { ...s.edges },
    edgeMarks: { ...s.edgeMarks },
    pointers: { ...s.pointers },
    ranges: { ...s.ranges },
    vars: { ...s.vars },
    line: s.line,
    note: s.note,
  };
}

function applyOp(s: ViewState, op: ModelOp): void {
  switch (op.op) {
    case 'collection':
      s.collections[op.id] = { shape: op.shape, label: op.label };
      break;
    case 'create': {
      s.entities[op.id] = { value: op.value };
      s.entityLoc[op.id] = op.at;
      s.occupancy[locationKey(op.at)] = op.id;
      break;
    }
    case 'destroy': {
      const loc = s.entityLoc[op.id];
      if (loc && s.occupancy[locationKey(loc)] === op.id) {
        delete s.occupancy[locationKey(loc)];
      }
      delete s.entities[op.id];
      delete s.entityLoc[op.id];
      delete s.marks[op.id];
      break;
    }
    case 'move': {
      const prev = s.entityLoc[op.id];
      if (prev && s.occupancy[locationKey(prev)] === op.id) {
        delete s.occupancy[locationKey(prev)];
      }
      s.entityLoc[op.id] = op.to;
      s.occupancy[locationKey(op.to)] = op.id;
      break;
    }
    case 'swap': {
      const la = s.entityLoc[op.a];
      const lb = s.entityLoc[op.b];
      if (la && lb) {
        s.entityLoc[op.a] = lb;
        s.entityLoc[op.b] = la;
        s.occupancy[locationKey(lb)] = op.a;
        s.occupancy[locationKey(la)] = op.b;
      }
      break;
    }
    case 'setValue':
      if (s.entities[op.id]) s.entities[op.id] = { value: op.value };
      break;
    case 'link':
      s.edges[edgeKey(op.from, op.rel, op.to)] = {
        from: op.from,
        to: op.to,
        rel: op.rel,
        edge: op.edge,
      };
      break;
    case 'unlink':
      delete s.edges[edgeKey(op.from, op.rel, op.to)];
      delete s.edgeMarks[edgeMarkKey(op.from, op.to)];
      break;
  }
}

function applyAnnotation(s: ViewState, a: Annotation): void {
  switch (a.an) {
    case 'mark':
      s.marks[a.target] = a.state;
      break;
    case 'unmark':
      delete s.marks[a.target];
      break;
    case 'flash':
      for (const t of a.targets) s.flashes[t] = a.state;
      break;
    case 'edgeMark':
      s.edgeMarks[edgeMarkKey(a.from, a.to)] = a.state;
      break;
    case 'edgeUnmark':
      delete s.edgeMarks[edgeMarkKey(a.from, a.to)];
      break;
    case 'pointer':
      s.pointers[a.name] = a.at;
      break;
    case 'range':
      s.ranges[a.name] = { col: a.col, from: a.from, to: a.to };
      break;
    case 'clearRange':
      delete s.ranges[a.name];
      break;
    case 'vars':
      s.vars = { ...s.vars, ...a.values };
      break;
  }
}

export function reduce(state: ViewState, frame: Frame): ViewState {
  const next = clone(state);
  if (frame.ops) for (const op of frame.ops) applyOp(next, op);
  if (frame.annotate) for (const a of frame.annotate) applyAnnotation(next, a);
  next.line = frame.line;
  next.note = frame.note;
  return next;
}

// Ordered entity ids occupying an array/stack/queue collection, by index.
export function orderedIndices(
  s: ViewState,
  col: CollectionId,
): { id: EntityId; index: number }[] {
  const out: { id: EntityId; index: number }[] = [];
  for (const [id, loc] of Object.entries(s.entityLoc)) {
    if (loc.kind === 'index' && loc.col === col) out.push({ id, index: loc.index });
  }
  out.sort((a, b) => a.index - b.index);
  return out;
}
