# AlgoLab

AlgoLab is an interactive algorithm-learning site where the data moves, not just the
explanation. Arrays swap, pointers glide, graph edges light up, and the same playback
engine later powers Exercise mode so users can watch their own code run visually, even
when it is wrong.

The product direction is dark mode, colorful algorithm states, glassmorphism UI, and a
fully static deployment. No backend, no accounts, no light mode for v1.

## Current status

The repo is currently in the planning/scaffold stage. The Vite React TypeScript scaffold
exists, and the roadmap/spec documents define the engine contract before product UI work
starts.

Next implementation target: **Phase 0 - Engine Contract Spike**.

Phase 0 proves the animation data model with:

- protocol types for frames, model operations, annotations, entity identity, and location
- a pure reducer with snapshot checkpoints
- a minimal player
- a minimal ArrayView bars renderer
- Bubble Sort as the first real AlgoModule
- five headless protocol fixtures: Bubble Sort, Binary Search, Reverse Linked List,
  Dijkstra, and N-Queens

Product polish and the first complete algorithm page are Phase 0B, not Phase 0.

## Documentation map

The planning docs are the source of truth:

| File | Purpose |
| --- | --- |
| [PLAN.md](PLAN.md) | Product vision, scope, features, and document index |
| [PHASES.md](PHASES.md) | Phase-by-phase build roadmap and exit criteria |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Step-event engine, protocol, reducer, player, Exercise sandbox |
| [DESIGN.md](DESIGN.md) | Visual language, state colors, layout, motion, accessibility |
| [ALGORITHMS.md](ALGORITHMS.md) | First 50 algorithms, categories, difficulty, acceptance rows |
| [DECISIONS.md](DECISIONS.md) | Decision log for architectural and planning changes |
| [CLAUDE.md](CLAUDE.md) | Contributor/agent workflow rules |

When files disagree, `PHASES.md` owns phase scope and exit criteria.

## Core architecture

The load-bearing rule:

**Algorithms never touch the DOM. Renderers never contain algorithm logic.**

Academy algorithm modules emit `Frame[]` directly. Exercise mode records location-level
`RawOp[]` from sandboxed user code and normalizes those operations into the same frame
protocol. A pure reducer folds frames into `ViewState`, and renderers consume only that
view state.

That shared pipeline is what lets Academy pages, Exercise recordings, step-back,
scrubbing, code highlighting, and state panels all stay in sync.

## Tech stack

Planned stack:

- React 19 + TypeScript + Vite
- react-router
- Tailwind for UI chrome only
- CSS variables + SVG attributes for visualization styling
- Framer Motion for movement/layout animation
- Shiki for Academy code highlighting
- Monaco for Exercise only, lazy-loaded
- Zustand for player state
- Vitest and Playwright once Phase 0/0B adds the test setup

The current scaffold has only the initial Vite dependencies. Additional packages arrive
with the phase that needs them.

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Lint:

```bash
npm run lint
```

Preview the production build:

```bash
npm run preview
```

Phase 0B adds the fuller verification set: `typecheck`, `test`, `test:e2e`, and a bundle
gate that keeps Monaco out of Academy chunks.

## Build roadmap

Short version:

- Phase 0: engine contract spike, protocol fixtures, no product polish
- Phase 0B: first usable Bubble Sort page
- Phase 1A-1C: Sorting, Arrays & Two Pointers, Searching, catalog, public ship
- Phase 2A-2D: remaining data structures and all 50 Academy algorithms
- Phase 3A-3C: Exercise sandbox, Exercise UI shell, first five exercises
- Phase 4: more exercises and quality-of-life features

See [PHASES.md](PHASES.md) for exact scope and merge criteria.

## Workflow rules

- `main` holds planning, scaffolding, and merged work.
- Real feature work happens on branches.
- Planning/design changes are committed separately from implementation.
- One phase or one concern per branch.
- Do not silently change the architecture; append the decision to [DECISIONS.md](DECISIONS.md).

Branch naming follows:

- `feat/<slug>` for functionality
- `fix/<slug>` for bug fixes
- `docs/<slug>` for documentation-only changes
- `chore/<slug>` for tooling, dependencies, and config

## Product principles

- Static site only; progress lives in localStorage.
- Dark mode only.
- The visualization state-color language is global.
- Every persistent visual annotation has an explicit inverse.
- Exercise mode must animate wrong behavior without freezing the tab.
- No one-off animation code per algorithm; every page uses the shared engine.
