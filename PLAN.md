# AlgoLab — Project Plan

> An interactive, animated website for learning algorithms. Dark mode, colorful, glassmorphism.
> Two sections: **Academy** (learn by watching live animations) and **Exercise** (write code, watch it run visually).

## Documents in this repo

| File | Purpose |
|---|---|
| [PLAN.md](PLAN.md) | This file — vision, scope, features |
| [DESIGN.md](DESIGN.md) | Visual design system: colors, glass, typography, animation rules |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Tech stack and the step-event visualization engine (the core of the app) |
| [ALGORITHMS.md](ALGORITHMS.md) | Catalog of the first 50 algorithms, classified by pattern |
| [PHASES.md](PHASES.md) | Build roadmap, phase by phase |
| [DECISIONS.md](DECISIONS.md) | Decision log — what was chosen and why |

## Vision

Most algorithm sites show static diagrams or pre-rendered GIFs. AlgoLab shows the **data moving**:
elements light up as they are compared, swap with smooth motion, pointers glide across arrays,
tree nodes pulse as they are visited. The user controls playback like a video player
(play / pause / step / speed / scrub).

Later, in Exercise mode, the user writes their own implementation and sees **their own code's
data movement animated live — even when the code is wrong**. Seeing a wrong answer move is the
fastest way to understand the bug.

## Core features

### Navigation
- Top nav bar, always visible: **Logo | Academy | Exercise**
- Exercise appears in the nav from day one but shows a "Coming soon" page until Phase 3.

### Academy (Phase 1–2)
- **Catalog page**: 50 algorithms in a grid of glass cards, grouped by pattern category
  (Arrays & Two Pointers, Sorting, Searching, Linked List, Stack & Queue, Trees, Heap,
  Graphs, Dynamic Programming, Backtracking, Greedy). Each category has its own accent color.
- **Algorithm page** for each algorithm:
  - Animated visualization panel (the star of the page) — data lights up and moves as the
    algorithm runs.
  - Playback controls: play/pause, step forward, step back, speed slider (0.25×–4×),
    progress scrubber, restart, "randomize input" and "edit input".
  - Code panel showing the reference implementation with the **currently executing line
    highlighted in sync** with the animation.
  - State panel: current variable values (pointers, counters, best-so-far) updated per step.
  - Short explanation: what the pattern is, when to use it, complexity (time/space),
    common pitfalls.
- Search and filter by category / difficulty.
- Progress: locally stored "viewed / understood" checkmarks per algorithm (no accounts in v1).

### Exercise (Phase 3+)
- Problem statement + starter code in an in-browser editor (Monaco).
- User writes JavaScript. On "Run", the code executes in a sandboxed worker against
  **instrumented data structures** that record every read/write/compare/swap.
- The side-by-side preview replays those recorded events as an animation — **whether or not
  the answer is correct**. A wrong sort still animates; the user watches where it goes wrong.
- Test cases run afterward; results shown pass/fail with the failing case animatable.
- Guardrails: step budget + timeout so infinite loops just truncate the animation with a
  "step limit reached" notice instead of freezing the tab.

## Non-goals (v1)
- No user accounts, no backend, no server — fully static site, deployable to any static host.
- No languages other than JavaScript in Exercise (v1).
- No mobile-first optimization; desktop-first, but must not break on tablet.
- No light mode. Dark only, by design.

## Target audience
- The site owner (learning algorithms) and any visitor. No login, instantly usable.

## Success criteria for Phase 1
- Academy live with at least the Sorting + Arrays categories fully animated (≈15 algorithms).
- Every animation driven by the shared step-engine (see ARCHITECTURE.md) — no one-off
  hand-coded animations, because Exercise will reuse the same renderer later.
- Lighthouse performance ≥ 90 on the catalog page; animations at 60fps for arrays of 30 items.
