# PHASES.md — Build Roadmap

Each phase ends in a deployable state. Do not start a phase before the previous one's
exit criteria pass.

## Phase 0 — Foundation (the engine before any content)
**Goal: prove the step-event pipeline end-to-end with ONE algorithm.**

- Scaffold: Vite + React + TS + Tailwind; tokens.css with all DESIGN.md variables; dark
  background with gradient blobs; glass panel component; nav bar (Academy active,
  Exercise → "coming soon" page).
- Implement `engine/steps.ts`, `engine/player.ts` (play/pause/step/back/speed/scrub/keyboard).
- Implement `ArrayView` (bars mode) with the full state-color language and swap choreography.
- Implement **Bubble Sort** as the first `AlgoModule`, wired into a complete algorithm page:
  viz + playback bar + synced code highlight + state panel + explanation.

**Exit criteria:** Bubble sort plays, pauses, steps backward/forward, scrubs, and the code
line highlight stays in sync at every speed. 60fps with 30 bars.

## Phase 1 — Academy core (arrays universe)
**Goal: the site is genuinely useful for array-based learning.**

- Catalog page: category sections, glass cards, search + filters, difficulty dots.
- `ArrayView` boxes mode, pointer chevrons, range brackets, window highlights.
- Ship categories: **Sorting (8), Arrays & Two Pointers (10), Searching (4)** = algorithms 1–22.
- Input controls: randomize (seeded) + edit input.
- localStorage progress checkmarks.
- Deploy publicly.

**Exit criteria:** 22 algorithms animated via the shared engine, no one-off animation code;
Lighthouse ≥ 90 on catalog.

## Phase 2 — Academy complete (structures)
**Goal: all 50 algorithms live.**

- Renderers: `LinkedListView`, `StackQueueView`, `TreeView` (tidy layout), `GraphView`
  (preset coordinates), `GridView`.
- Ship categories: Linked List (4), Stack & Queue (4), Trees (7), Heap (2), Graphs (6),
  DP (4), Backtracking (1) = algorithms 23–50.
- Polish pass: captions/`note` text on steps, per-category page headers, empty/edge-case
  inputs (already-sorted array, single node, disconnected graph).

**Exit criteria:** all 50 pages pass their "What lights up" acceptance rows in ALGORITHMS.md.

## Phase 3 — Exercise MVP
**Goal: write code, watch it move — even when wrong.**

- Worker sandbox + instrumentation prelude (Proxy array, swap/compare/pointer helpers),
  3s timeout, 50k step budget.
- Monaco editor (lazy-loaded), problem statement pane, side-by-side replay of the user's run.
- Test runner with pass/fail strip; click a failing case to load its recording.
- Launch with **5 array exercises**: implement Bubble Sort, Binary Search, Two-Pointer
  Two Sum, Reverse Array, Move Zeroes.

**Exit criteria:** intentionally-buggy submissions animate their wrong behavior;
infinite loop shows truncated recording with a banner, tab never freezes.

## Phase 4 — Exercise grows + quality of life
- More exercises across categories (target 20), each reusing an Academy renderer.
- Hints system (progressive reveal), solution reveal after N attempts.
- Shareable links encoding input state; algorithm-page deep links to the paired exercise.
- Optional later: accounts/sync, more languages via WASM, spaced-repetition review queue.

## Suggested first prompt for the builder AI
> Read PLAN.md, DESIGN.md, ARCHITECTURE.md, ALGORITHMS.md, PHASES.md, DECISIONS.md.
> Build Phase 0 exactly as specified. Do not invent alternative architectures: algorithms
> are generators yielding Frames; renderers only consume Steps. Stop after Phase 0 exit
> criteria and demonstrate them.
