# ARCHITECTURE.md — Tech Stack & the Step-Event Engine

> Revised after the pre-implementation architecture review (see DECISIONS.md D-12…D-19).
> The core idea is unchanged; the protocol now separates **element identity** from
> **location**, and separates **model mutations** from **visual annotations**, so the same
> engine can replay both our reference generators and arbitrary user code.

## The one load-bearing idea

**Algorithms never touch the DOM. Renderers never contain algorithm logic.**
Every algorithm produces a stream of **Frames**; a pure **reducer** folds Frames into a
**ViewState**; renderers are pure functions of ViewState. The **Player** just moves a
cursor over the Frame list.

```
Academy:   reference generator (emits Frames directly) ──┐
                                                         ├─► Frame[] ─► reducer ─► ViewState ─► Renderer (SVG)
Exercise:  user code in worker ─► RawOp[] ─► normalizer ─┘      │
           (instrumented structures record                      └─► frame.line → code highlight
            location-level operations)                              frame.note → caption
                                                                    vars annotation → state panel
```

Academy and Exercise meet at the Frame, not at the algorithm: Academy generators know
element identity and emit Frames directly; Exercise records **location-level RawOps**
(index reads/writes) and a **normalizer** lifts them into Frames using the occupancy
model. This is what makes wrong user code animate correctly-wrongly.

## Tech stack (pinned — no implementation-time forks)

| Concern | Choice | Notes |
|---|---|---|
| Framework | **React 19 + TypeScript + Vite** | React 19 is what the scaffold ships; no reason to downgrade (D-3 amended) |
| Routing | **react-router** | Pinned. Next.js option removed — static site, no server |
| Styling | **Tailwind for UI chrome only**; visualizations use plain CSS variables + SVG attributes | Tokens from DESIGN.md live once in `styles/tokens.css`; viz never uses Tailwind classes |
| Animation | **Framer Motion** for element movement/layout; CSS transitions for color/glow | Pinned |
| Viz rendering | **SVG** | ≤ ~100 elements in v1 |
| Code display | **Shiki** (build-time highlight, Academy) · **Monaco** (Exercise only, lazy chunk) | Bundle gate below |
| State | Zustand (player) + props | |
| Tests | **Vitest** (engine/generators/reducer) · **Playwright** (smoke e2e) | `npm run test`, `test:e2e` |
| Scripts | `dev`, `build`, `typecheck`, `test`, `test:e2e`, `lint` | CI runs all but dev |
| Persistence | localStorage | |
| Deploy | Static export | |

**Bundle gate:** the Academy route chunk must stay under **250 KB gzip** and must not
contain Monaco. Enforced with `size-limit` (or equivalent) in CI from Phase 0B onward.

## The event protocol v2

### Layer 0 — identity and location (the P0 fix)

`EntityId` is the stable identity of a datum; `Location` is where it currently sits.
They are never the same thing. The model maintains the `Location → EntityId` occupancy
map; events reference whichever layer they actually mean.

```ts
type EntityId     = string;   // stable for the life of the run, never reused
type CollectionId = string;   // 'main', 'aux', 'bucket-3', 'stack-a', 'output'
type NodeId       = string;   // tree/graph structural slots

type Location =
  | { kind: 'index'; col: CollectionId; index: number }              // arrays, stacks, queues
  | { kind: 'node';  col: CollectionId; node: NodeId }               // trees, graphs, lists
  | { kind: 'cell';  col: CollectionId; row: number; column: number } // grids / DP tables
```

### Layer 1 — Frame metadata

`line` and `note` live on the **Frame**, not on individual steps — one code line and one
caption per animation beat, so the player never has to guess.

```ts
interface Frame {
  ops?: ModelOp[];            // mutations, applied atomically
  annotate?: Annotation[];    // visual-only changes
  line?: number;              // highlighted source line for this beat
  note?: string;              // optional caption ("left < right → move lo")
  pace?: 'normal' | 'fast' | 'hold';  // relative duration hint
}
```

### Layer 2 — model operations (mutate data)

```ts
type Rel = 'next' | 'left' | 'right' | 'child' | 'edge';

type ModelOp =
  | { op: 'collection'; id: CollectionId; shape: 'array'|'list'|'stack'|'queue'|'tree'|'graph'|'grid'; label?: string }
  | { op: 'create';   id: EntityId; value: Value; at: Location }
  | { op: 'destroy';  id: EntityId }
  | { op: 'move';     id: EntityId; to: Location }
  | { op: 'swap';     a: EntityId; b: EntityId }          // exchange locations
  | { op: 'setValue'; id: EntityId; value: Value }
  | { op: 'link';     from: NodeId; to: NodeId; rel: Rel; edge?: { id?: string; directed?: boolean; weight?: number } }
  | { op: 'unlink';   from: NodeId; to: NodeId; rel: Rel };
```

Trees use `rel: 'left' | 'right'` (not a generic `child`); graph edges carry direction,
weight, and an id so Dijkstra can mark/relax specific edges. Multiple collections are
first-class: Counting Sort declares `main` + `counts` + `output`; Queue-via-two-stacks
declares `stack-a` + `stack-b`.

**Projections:** one collection may be rendered by several synchronized views (Heap =
tree view + array strip of the *same* entities). Declared per algorithm:
`views: [{ col: 'main', as: 'binary-heap-tree' }, { col: 'main', as: 'array-strip' }]`.

### Layer 3 — annotations (visual only, never mutate data)

```ts
type MarkState = 'sorted' | 'visited' | 'path' | 'discard';

type Annotation =
  | { an: 'mark';    target: EntityId | NodeId; state: MarkState }   // persistent until unmark
  | { an: 'unmark';  target: EntityId | NodeId }                     // restore idle
  | { an: 'flash';   targets: (EntityId | NodeId)[]; state: 'active' | 'compare' | 'error' } // transient, auto-clears next frame
  | { an: 'edgeMark';   from: NodeId; to: NodeId; state: MarkState } // path tracing
  | { an: 'edgeUnmark'; from: NodeId; to: NodeId }                   // restore edge to idle
  | { an: 'pointer'; name: string; at: Location | null }             // null removes the pointer
  | { an: 'range';   name: string; col: CollectionId; from: number; to: number } // inclusive; re-emit to move
  | { an: 'clearRange'; name: string }
  | { an: 'vars';    values: Record<string, Value> };
```

Every `MarkState`/flash state maps 1:1 to a DESIGN.md state token, including `discard`
and `error`. Ambiguities from v1 are resolved: ranges are removed with `clearRange`
(not `to: null`), marks are reversed with `unmark`, edge marks with `edgeUnmark` —
every persistent annotation has an explicit inverse, so graph animations (Dijkstra
relaxing then abandoning a tentative edge) never accumulate stale state. The Dijkstra
fixture must exercise `edgeUnmark`.

### Exercise RawOps (recorded, then normalized)

User code never emits Frames. Instrumented structures record location-level facts:

```ts
type RawOp =
  | { raw: 'readAt';    at: Location }
  | { raw: 'writeAt';   at: Location; value: Value }
  | { raw: 'swapAt';    a: Location; b: Location }      // via provided swap() helper
  | { raw: 'compareAt'; a: Location; b: Location }      // via provided compare() helper
  | { raw: 'pointerAt'; name: string; at: Location | null };
```

The **normalizer** (runs on the main thread, pure) folds RawOps into Frames against the
occupancy model: `swapAt` → entity swap; `writeAt` with a value that matches another
live entity → heuristic move; otherwise `writeAt` → destroy-occupant + create. The
heuristics can be imperfect — a wrong-looking animation of wrong code is acceptable;
a crashed renderer is not. Normalizer is heavily unit-tested with adversarial sequences
(duplicate values, self-swaps, out-of-bounds, splice-like shifts).

## Reducer, snapshots, player

- `reduce(viewState, frame) → viewState` is a **pure function**. ViewState = collections
  + occupancy + entity values + persistent marks + pointers + ranges + vars.
- On input change, frames are pre-collected (bounded, below) and reduced once; a
  **snapshot checkpoint is stored every 200 frames**. Step-back and scrubbing replay from
  the nearest checkpoint — never from frame 0, never via inverse operations (D-8 revised).
- Playback clock: rAF-based; the logical cursor advances only when the previous frame's
  animation duration (pace × speed) has elapsed, so Framer Motion transitions finish
  before the next beat at every speed. At ≥ 2× the renderer switches to the simplified
  path (no glow filters, no arcs) per DESIGN.md.
- **Collection limits** (apply to Academy and Exercise identically):
  max 50,000 frames · 200,000 ops · 5 MB serialized. Hitting any limit truncates with a
  visible "recording truncated" banner.
- Keyboard: Space play/pause, ←/→ step, ↑/↓ speed — active **only when focus is not in
  an input, textarea, or the Monaco editor**.

## Protocol fixtures — the gate before mass production

Phase 0 must include five **protocol fixtures**, one per data shape, written against the
real types (generator + expected ViewState assertions), proving the protocol spans the
catalog *before* any algorithm is mass-produced:

| Fixture | Shape | What it must prove |
|---|---|---|
| Bubble Sort | array | compare/swap/mark-sorted, ranges, deterministic forward/backward replay |
| Binary Search | array | discard marking, range squeeze, pointer semantics |
| Reverse Linked List | list | link/unlink, pointer over nodes, node-kind locations |
| Dijkstra | graph | weighted directed edges, edgeMark/edgeUnmark, vars (distance table), multi-collection (PQ strip) |
| N-Queens | grid | cell locations, place/remove, error flash, backtrack unwind |

If the protocol cannot express one of these cleanly, **fix the protocol in Phase 0**,
not the fixture.

## AlgoModule contract (day-one requirements, not Phase-2 polish)

```ts
interface AlgoModule {
  meta: {
    slug: string; title: string; category: Category; paradigm: Paradigm[];
    difficulty: 'easy'|'medium'|'hard';
    complexity: { time: string; timeWorst?: string; space: string }; // e.g. BST: avg + worst
    explanation: string;  // md: what/when/pitfalls — completeness is validated
  };
  code: string;                        // line numbers must match Frame.line
  input: {
    schema: InputSchema;               // shape, value constraints, maxVisualSize
    default: () => Input;
    random: (seed: number) => Input;   // seeded, deterministic
    edges: Partial<Record<'empty'|'single'|'duplicates'|'sorted'|'reversed', Input>>;
                                       // every applicable edge case, declared up front
  };
  scenario?: Operation[];              // for operation-sequence modules (Min Stack, BST ops,
                                       // prefix-sum queries): a scripted op sequence replaces
                                       // the single input→output run
  views?: ViewSpec[];                  // projections (heap tree + array strip)
  run: (input: Input) => Generator<Frame>;   // pure; no DOM, no timers, no randomness
  expect: {
    result?: (input: Input) => Value;              // oracle for tests
    invariants?: ((final: ViewState) => boolean)[]; // e.g. "occupancy is a permutation of input"
  };
}
```

A registry-level Vitest suite validates every module: edge inputs replay without errors,
`expect.result` matches, explanation sections present, complexity present, acceptance
fixture present. This is the "content schema" — 50 pages can't be hand-audited.

## Exercise mode (Phase 3) — sandbox design

Web Workers give **no DOM** but are *not* network-isolated by default. The sandbox is:

1. **Fresh dedicated worker per test case**, terminated after each run — no state leaks
   between cases, and a hung case can't block the next.
2. **Prelude neuters the network** before user code runs: `fetch`, `XMLHttpRequest`,
   `WebSocket`, `EventSource`, and `importScripts` are deleted/overridden in worker scope.
   Site CSP (`connect-src 'self'`, worker-src rules) backs this up at the platform level.
   User code is compiled inside the worker via `new Function` (CSP scoped accordingly).
3. **Streaming recording:** the worker posts RawOp batches every ~100 ms / 500 ops.
   The main thread keeps everything received; when the 3 s wall-clock timeout terminates
   the worker, **the partial recording survives** and replays with a truncation banner.
   (v1's design lost the whole recording on timeout — fixed.)
4. **Four independent limits:** wall time (3 s) · op count (200k) · frame count after
   normalization (50k) · serialized size (5 MB). An infinite loop that never touches the
   instrumented array is caught by wall time; one that spins on it is caught earlier by
   op count.
5. Tests run against the plain result (functional check) after recording; a failing case's
   recording loads into the player on click. Test execution and normalization never block
   the UI thread beyond the normalizer's bounded work.

## Project structure

```
src/
  app/                    # routes: /, /academy, /academy/:slug, /exercise
  components/             # nav, cards, panels, playback bar
  engine/
    protocol.ts           # EntityId/Location/Frame/ModelOp/Annotation (single source of truth)
    reduce.ts             # pure reducer + snapshot checkpoints
    player.ts             # playback state machine (zustand)
    normalize.ts          # RawOp[] → Frame[] (Exercise; unit-tested adversarially)
    fixtures/             # the 5 protocol fixtures + replay/scrub correctness tests
  renderers/
    ArrayView.tsx  LinkedListView.tsx  StackQueueView.tsx  TreeView.tsx  GraphView.tsx  GridView.tsx
  algos/
    <category>/<slug>.ts  # one AlgoModule per algorithm
    registry.ts           # catalog + content-schema validation suite
  exercise/               # Phase 3: worker host, sandbox prelude, test runner
  styles/tokens.css       # CSS variables from DESIGN.md
```

## Testing

- **Engine:** reducer purity/replay determinism (same frames ⇒ same ViewState), checkpoint
  scrub equivalence (scrub-to-n ≡ play-to-n), normalizer adversarial suite.
- **Modules:** registry suite (edges replay, oracle matches, content complete).
- **E2E:** one Playwright smoke — catalog renders, an algo page plays to completion,
  keyboard controls work.
