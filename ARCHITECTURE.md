# ARCHITECTURE.md — Tech Stack & the Step-Event Engine

## The one load-bearing idea

**Algorithms never touch the DOM. Renderers never contain algorithm logic.**
Every algorithm is written as a **generator that yields step events**; a shared **player**
consumes events and drives a **renderer** for the data shape (array, tree, graph, …).

This single decision is what makes Exercise cheap later: Academy plays events from our
reference implementations; Exercise plays events recorded from *the user's* code via
instrumented data structures. Same events, same player, same renderers, same colors.

```
Academy:   reference generator ──┐
                                 ├──► event stream ──► Player ──► Renderer (SVG)
Exercise:  user code in worker ──┘        │
           (instrumented structures)      └──► synced code-line highlight + state panel
```

## Tech stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **React 18 + TypeScript + Vite** | Huge ecosystem, any AI can build it, fast dev server, static output |
| Routing | react-router (or file-based if the builder prefers Next.js static export) | Static site, no server |
| Styling | **Tailwind CSS** + CSS variables from DESIGN.md | Tokens as CSS vars keeps the design system enforceable |
| Animation | **Framer Motion** for element enter/exit/layout; CSS transitions for color/glow | `layoutId`-based swaps are exactly the arc-swap we need |
| Viz rendering | **SVG** (not canvas) for v1 | ≤ ~100 elements; SVG gives free DOM events, crisp text, easy glow filters |
| Code display | Shiki or highlight.js (Academy), **Monaco** (Exercise only, lazy-loaded) | Monaco is heavy; don't ship it to Academy pages |
| State | Zustand (player state) + plain props | Small surface, no boilerplate |
| Persistence | localStorage (progress checkmarks, settings) | No backend in v1 |
| Deploy | Static export → Netlify / Vercel / GitHub Pages | Zero ops |

## The event protocol (heart of the system)

```ts
// Every visual change is one of these. Keep the union SMALL and generic;
// renderers map them to visuals per data shape.
type Step =
  | { t: 'compare';  ids: [Id, Id];  line?: number; note?: string }
  | { t: 'read';     id: Id;         line?: number }
  | { t: 'write';    id: Id; value: Value; line?: number }   // covers set/overwrite
  | { t: 'swap';     ids: [Id, Id];  line?: number }
  | { t: 'pointer';  name: string; id: Id | null; line?: number } // move/remove a labeled pointer
  | { t: 'mark';     id: Id; state: 'sorted'|'visited'|'path'|'active'|'discard'; line?: number }
  | { t: 'range';    name: string; from: Id; to: Id | null }  // highlight a window/subarray
  | { t: 'insert';   id: Id; value: Value; after?: Id }       // lists/trees/heaps
  | { t: 'remove';   id: Id }
  | { t: 'link';     from: Id; to: Id; kind?: 'next'|'child'|'edge' } // lists/trees/graphs
  | { t: 'unlink';   from: Id; to: Id }
  | { t: 'vars';     values: Record<string, Value> }          // state panel update
  | { t: 'done';     result?: Value };

type Frame = Step[];   // steps that animate simultaneously
```

- `Id` is a stable element id (not an index) so swaps/moves can be animated by identity.
- `line` powers the synced code highlight; `note` powers optional captions
  ("left < right, move left pointer →").

### Reference algorithms (Academy)

```ts
// Every algorithm module exports this shape:
interface AlgoModule {
  meta: AlgoMeta;                    // slug, title, category, difficulty, complexity, explanation md
  code: string;                      // display source, line numbers match `line` fields
  defaultInput: () => Input;
  randomInput: (seed?: number) => Input;
  run: (input: Input) => Generator<Frame>;   // pure, no DOM, no timers
}
```

Author `run` as a generator so it costs nothing to pause/step. The Player pre-collects all
frames on input change (algorithms on ≤100 elements finish instantly), enabling the scrubber
and **step-back** (replay from frame 0 to n-1 against a cloned initial model — cheap at this
scale; no inverse-operations needed).

### Player

- Holds: `frames[]`, cursor, playing flag, speed. Advances on a rAF-based clock scaled by speed.
- Emits current frame to the renderer; emits `line` to the code panel; folds `vars` steps
  into the state panel.
- Keyboard: Space play/pause, ←/→ step, ↑/↓ speed. Scrubber sets cursor directly.
- Hard cap: 50,000 frames → stop with "step limit reached" banner (protects Exercise later).

### Renderers (one per data shape, all consume the same Steps)

| Renderer | Layout | Used by |
|---|---|---|
| `ArrayView` | Bars mode (heights, for sorting) and boxes mode (values, for pointers/windows) | Arrays, Sorting, Searching, DP tables (2D grid variant) |
| `LinkedListView` | Nodes + animated arrows | Linked List |
| `StackQueueView` | Vertical stack / horizontal queue | Stack & Queue |
| `TreeView` | Auto-layout tidy tree (Reingold–Tilford) | Trees, Heap (plus mirrored array strip for heap) |
| `GraphView` | Preset coordinates per example graph (no force layout in v1) | Graphs |
| `GridView` | 2D matrix cells | DP, islands, N-Queens, maze/backtracking |

Renderers translate Step → visual using ONLY the state colors in DESIGN.md §1.

## Exercise mode (Phase 3) — how "animate even wrong code" works

1. User code (JS) is bundled with a prelude and run in a **sandboxed Web Worker**
   (no DOM, no network; terminated on 3s timeout).
2. The prelude hands the user **instrumented structures**: an array wrapped in a `Proxy`
   that records `read`/`write` steps, plus helpers `swap(i,j)`, `compare(i,j)`,
   `pointer(name,i)` that record richer steps. Problem statements tell users to use the
   provided `arr` (reads/writes are captured automatically even if they ignore helpers).
3. Worker posts the recorded `Frame[]` back — regardless of correctness. Player replays it
   in the same renderer. A wrong bubble sort animates wrongly, which is the point.
4. Then tests run (plain functional checks on the result) and render pass/fail; clicking a
   failing case loads that input's recording into the player.
5. Step budget (50k) turns infinite loops into truncated-but-viewable recordings.

**Phase-1 obligation**: nothing in Academy may bypass the event protocol, or Exercise
will need a rewrite.

## Project structure

```
src/
  app/                  # routes: /, /academy, /academy/:slug, /exercise
  components/           # nav, cards, panels, playback bar
  engine/
    steps.ts            # Step/Frame types (single source of truth)
    player.ts           # playback state machine (zustand store)
  renderers/
    ArrayView.tsx  TreeView.tsx  GraphView.tsx  GridView.tsx  LinkedListView.tsx  StackQueueView.tsx
  algos/
    <category>/<slug>.ts   # one AlgoModule per algorithm (see ALGORITHMS.md)
    registry.ts            # imports all modules, builds catalog
  exercise/           # Phase 3: worker sandbox, instrumentation prelude, test runner
  styles/tokens.css   # CSS variables from DESIGN.md
```

## Testing
- Unit-test generators: run to completion, assert final `done.result` and spot-check
  event sequences (e.g. bubble sort on [3,1,2] yields expected compare/swap order).
  Generators are pure functions — this is trivial and high-value.
- One Playwright smoke test: catalog renders, an algo page plays to completion.
