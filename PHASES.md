# PHASES.md — Build Roadmap

> **This file is the single source of truth for phase scope and exit criteria.**
> Where PLAN.md summarizes scope, this file's numbers win.

Each phase is one branch, ends in a state that builds + type-checks + passes tests, and
merges only when its exit criteria pass. Do not start a phase before the previous one
merges.

## Phase 0 — Engine Contract Spike
**Goal: prove the animation data model. No product UI, no polish.**

Phase 0 answers "does this architecture stand up?", not "does the first page look
complete." The project's core risk is whether the event protocol can support 50
algorithms *and* arbitrary user code — so that contract gets built and tested first,
against the smallest possible surface.

- Define the protocol types: `Frame` / `ModelOp` / `Annotation` / `EntityId` / `Location`
  (`engine/protocol.ts`, exactly as specified in ARCHITECTURE.md).
- Implement the pure reducer (`reduce.ts`) with snapshot checkpoints.
- Implement minimal player: play / pause / next / previous — nothing else.
- Implement one minimal `ArrayView` bars renderer (correct state colors, no choreography
  polish).
- Implement Bubble Sort as a real `AlgoModule` (full contract: input schema, edges,
  oracle) — the first protocol fixture.
- Write the remaining four **protocol fixtures** (Binary Search, Reverse Linked List,
  Dijkstra, N-Queens) as headless generator + reducer tests — no renderers for them yet.
- Tests: replay determinism, reverse-step correctness, scrub-equals-play, fixture
  assertions.

**Exit criteria:**
- Bubble Sort replays forward/backward deterministically from recorded Frames.
- No DOM access from any algorithm code (enforced by the module being importable and
  runnable inside Vitest/node).
- The protocol expresses all five fixtures — compare, swap, mark/unmark, range/window,
  links with left/right and weighted directed edges, grid cells, error flash — without
  protocol changes pending.

## Phase 0B — First Usable Algorithm Page
**Goal: turn the proven engine into one complete, good-looking page.**

- Design tokens (`tokens.css`), dark background + gradient blobs, glass panel component,
  nav bar (Academy active; Exercise → "coming soon").
- Playback speed control, scrubber, keyboard shortcuts (with input/editor focus scoping).
- Swap choreography and glow polish per DESIGN.md; simplified rendering path at ≥ 2×.
- Synced code highlight (Shiki), state panel, explanation section.
- Bubble Sort page fully assembled in the algorithm-page layout.
- Set real package name/title/favicon (replace scaffold's `scaf`).
- CI: `typecheck` + `test` + `lint` + bundle gate (`size-limit`).

**Exit criteria (measurable):**
- Fixture: 30 bars, reversed input, Chromium latest stable on the dev machine, one full
  1× playback: dropped-frame ratio < 5%, no long task > 50 ms during playback
  (measured via Performance panel / `PerformanceObserver`, repeated 3 runs).
- At 4×: simplified path active, playback remains coherent (cursor never outruns
  animation completion).
- `prefers-reduced-motion`: discrete state changes, no positional animation.
- Academy route chunk < 250 KB gzip; Monaco absent from it.
- Code-line highlight stays in sync at every speed and after scrubbing.

## Phase 1A — Sorting (8 algos)
- `ArrayView` bars mode hardened; multi-collection support (Counting/Radix buckets).
- Heap Sort's tree strip is a **`HeapStripView`: the minimal projection only** — fixed
  complete-binary-tree layout computed from array indices (parent/child positions are
  arithmetic, no layout algorithm), nodes + edges + state colors, nothing else. It is
  *not* the start of `TreeView` (no arbitrary shapes, no insert/remove relayout, no
  left/right links — those arrive in Phase 2B). If a requirement can't be met without
  real TreeView capability, it moves to 2B rather than growing this component.
- Algorithms 1–8, each passing the registry content-schema suite and its edge inputs
  (empty, single, duplicates, sorted, reversed).

**Exit:** all 8 pages pass their ALGORITHMS.md "what lights up" rows; registry suite
green; `HeapStripView` contains no general tree-layout code.

## Phase 1B — Arrays & Two Pointers (10 algos)
- `ArrayView` boxes mode: pointer chevrons, range brackets, window highlights.
- Algorithms 9–18.

**Exit:** same bar as 1A, plus pointer/range semantics visually verified against fixtures.

## Phase 1C — Searching + Catalog + Ship
- Algorithms 19–22 (discard dimming, boundary squeeze).
- Catalog page: category sections, glass cards, search, filters (category/difficulty),
  difficulty-sort toggle.
- Input controls on algo pages: seeded randomize + edit input (validated by input schema).
- localStorage progress checkmarks.
- Deploy publicly.

**Exit:** 22 algorithms live via the shared engine (zero one-off animation code);
Lighthouse ≥ 90 on catalog; e2e smoke green.

## Phase 2A — Linear structures (8 algos)
- `LinkedListView`, `StackQueueView` renderers.
- Algorithms 23–30.

**Exit:** all 8 linear-structure pages pass their acceptance rows; `LinkedListView` and
`StackQueueView` fixture tests green; no protocol changes were required (if one was,
stop and log the decision before proceeding).

## Phase 2B — Trees & Heap (9 algos)
- `TreeView` proper: tidy layout (Reingold–Tilford), arbitrary shapes, left/right links,
  insert/remove relayout. `HeapStripView` retired or absorbed as a TreeView mode.
- Algorithms 31–39.

**Exit:** all 9 pages pass their acceptance rows; TreeView fixture green; Heap pages show
tree + array strip in sync (same entities, both views).

## Phase 2C — Graphs (6 algos)
- `GraphView` (preset coordinates, directed/weighted edges, edgeMark/edgeUnmark) and
  `GridView` (for Islands).
- Algorithms 40–45.

**Exit:** all 6 pages pass their acceptance rows; Dijkstra page exercises edge
mark/unmark with no stale edge state after replay/scrub.

## Phase 2D — DP + Backtracking + Academy complete (5 algos)
- `GridView` completed (cell dependencies/arrows for DP traceback).
- Algorithms 46–50.
- Final polish pass across all 50: captions (`note`) coverage, per-category headers.

**Exit:** all 50 pages pass their acceptance rows; registry suite validates all 50
modules' content completeness; e2e smoke green.

## Phase 3 — Exercise (write code, watch it move — even when wrong)

### Phase 3A — Sandbox + Normalizer (no UI)
- Sandbox per ARCHITECTURE.md: fresh worker per test case, network neutered
  (`fetch`/XHR/WebSocket/EventSource/`importScripts` removed + CSP), streaming RawOp
  batches so timeout keeps the partial recording, four limits (3 s wall / 200k ops /
  50k frames / 5 MB).
- Normalizer (`normalize.ts`) with adversarial unit suite (duplicates, self-swaps,
  out-of-bounds, splice-like shifts).
- No Monaco, no product UI — a debug harness page that runs pasted code is enough.

**Exit (all verified headlessly or via the harness):** buggy reference submissions
produce replayable recordings; both infinite-loop kinds (array-touching → op limit,
pure-spin → wall clock) yield truncated-but-viewable recordings without freezing the
tab; normalizer suite green.

### Phase 3B — Exercise UI Shell
- Monaco as a lazy chunk, problem pane, side-by-side replay using the Academy player and
  renderers, test runner with pass/fail strip; failing case click-loads its recording.
- One placeholder exercise wired end-to-end to prove the shell.

**Exit:** full write→run→watch→test loop works on the placeholder; Academy route chunk
unchanged (bundle gate proves Monaco stayed out).

### Phase 3C — First 5 Exercises
- Bubble Sort, Binary Search, Two-Pointer Two Sum, Reverse Array, Move Zeroes —
  each with statement, starter code, test cases, and an intentionally-buggy reference
  submission in tests proving its wrongness animates.

**Exit:** all 5 exercises pass the loop above; wrong-code animations verified per
exercise.

## Phase 4 — Growth
- More exercises (target 20) reusing Academy renderers.
- Hints (progressive reveal), solution reveal after N attempts.
- Shareable input-state links; algo-page ↔ exercise deep links.
- Optional: accounts/sync, more languages via WASM, spaced-repetition queue.

## Suggested first prompt for the builder AI
> Read CLAUDE.md, PLAN.md, DESIGN.md, ARCHITECTURE.md, ALGORITHMS.md, PHASES.md,
> DECISIONS.md. Build **Phase 0 only**, exactly as specified: protocol types, pure
> reducer, minimal player, minimal ArrayView, Bubble Sort AlgoModule, and all five
> protocol fixtures with their tests. Do not build product UI, do not add polish, do not
> invent alternative architectures. Stop when Phase 0 exit criteria pass and demonstrate
> them with the test suite.
