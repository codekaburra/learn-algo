// Small helpers so algorithm generators stay concise while emitting correct
// entity/location ops. Algorithms work with indices; helpers translate to the
// identity-aware protocol (swaps exchange entity locations, not values).

import type {
  Annotation,
  CollectionId,
  EntityId,
  Frame,
  ModelOp,
  Value,
} from '../engine/protocol';
import { idx } from '../engine/protocol';

/** Tracks a single array collection's entity identities by current index. */
export class ArrayModel {
  col: CollectionId;
  ids: EntityId[]; // ids[i] = entity currently at index i
  values: Record<EntityId, Value> = {};

  constructor(col: CollectionId, values: Value[], prefix = col) {
    this.col = col;
    this.ids = values.map((_, i) => `${prefix}-${i}`);
    values.forEach((v, i) => (this.values[this.ids[i]] = v));
  }

  setupOps(shape: 'array' | 'stack' | 'queue' = 'array', label?: string): ModelOp[] {
    const ops: ModelOp[] = [
      { op: 'collection', id: this.col, shape, label },
    ];
    this.ids.forEach((id, i) => {
      ops.push({ op: 'create', id, value: this.values[id], at: idx(this.col, i) });
    });
    return ops;
  }

  at(index: number): EntityId {
    return this.ids[index];
  }

  valAt(index: number): number {
    return this.values[this.ids[index]] as number;
  }

  /** Exchange the entities at two indices; returns the swap op. */
  swap(i: number, j: number): ModelOp {
    const a = this.ids[i];
    const b = this.ids[j];
    [this.ids[i], this.ids[j]] = [this.ids[j], this.ids[i]];
    return { op: 'swap', a, b };
  }

  /** Overwrite the value at an index (identity preserved). */
  setValueOp(index: number, value: Value): ModelOp {
    this.values[this.ids[index]] = value;
    return { op: 'setValue', id: this.ids[index], value };
  }

  get length(): number {
    return this.ids.length;
  }
}

export function frame(f: Frame): Frame {
  return f;
}

export function flash(
  targets: (EntityId | string)[],
  state: 'active' | 'compare' | 'error',
): Annotation {
  return { an: 'flash', targets, state };
}

export function mark(target: string, state: 'sorted' | 'visited' | 'path' | 'discard'): Annotation {
  return { an: 'mark', target, state };
}

export function pointer(name: string, col: CollectionId, index: number | null): Annotation {
  return { an: 'pointer', name, at: index === null ? null : idx(col, index) };
}

export function vars(values: Record<string, Value>): Annotation {
  return { an: 'vars', values };
}

export function range(name: string, col: CollectionId, from: number, to: number): Annotation {
  return { an: 'range', name, col, from, to };
}
