# DECISIONS.md — Decision Log

Format: **D-n · Decision — rationale — alternatives rejected.**
Builder AI: append new decisions here instead of silently choosing.

---

**D-1 · Step-event engine: algorithms are generators yielding events; renderers only consume events.**
Rationale: one animation system serves both Academy (reference code) and Exercise (user
code, recorded via instrumentation). Also enables step-back, scrubbing, and speed control
for free, and makes algorithms unit-testable as pure functions.
Rejected: hand-animating each algorithm page (unmaintainable at 50 algos; Exercise would
need a from-scratch rewrite).

**D-2 · SVG rendering, not Canvas/WebGL.**
Rationale: v1 visualizations are ≤ ~100 elements; SVG gives crisp text, CSS/Framer Motion
animation, glow filters, and hover events with far less code.
Rejected: Canvas (needed only if we later animate 1000+ elements — revisit then).

**D-3 · React 19 + TypeScript + Vite + react-router + Tailwind (chrome only) + Framer Motion.**
*(Amended by D-17 — stack now fully pinned, no implementation-time forks.)*
Rationale: the most widely known stack — any builder AI or human contributor is productive
immediately; static output; Framer Motion's layout animations map directly to swap arcs.
React 19 because that is what the scaffold ships. Tailwind is scoped to UI chrome;
visualizations use plain CSS variables + SVG attributes so the design tokens stay the
single styling source inside the engine.
Rejected: Svelte (smaller ecosystem), Next.js (removed as an option — a fork like
"react-router or Next.js" is an implementation-time decision we refuse to defer),
CSS-only (Tailwind still earns its keep for chrome velocity).

**D-4 · Fully static site, no backend, progress in localStorage.**
Rationale: zero ops cost, instant deploys, nothing to secure; v1 has no data worth syncing.
Rejected: accounts + database (deferred to Phase 4 "optional" at the earliest).

**D-5 · Pattern-based classification, 10 populated categories + Greedy reserved, 50 algorithms.**
Rationale: patterns (two pointers, sliding window, BFS/DFS, DP table…) are how interview
prep is actually taught; each category maps 1:1 to a renderer and an accent color.
Rejected: textbook classification (divide & conquer / greedy / etc. — too abstract for
visual grouping), difficulty-ordered flat list (hides the transferable patterns).

**D-6 · Dark mode only.**
Rationale: explicit product requirement; glow-on-dark IS the visual identity. Halves the
design/QA surface. Rejected: theme toggle.

**D-7 · Exercise = JavaScript only, sandboxed Web Worker, Proxy-instrumented structures.**
Rationale: runs fully in-browser (keeps D-4), Proxy captures reads/writes even from code
that ignores our helper API — which is what makes wrong code still animate.
Rejected: server-side execution (backend + security burden), Pyodide/WASM for Python
(heavy; Phase 4+ candidate), AST-instrumentation of user code (fragile; Proxy is enough
for array problems).

**D-8 · Step-back and scrub replay from snapshot checkpoints (every 200 frames), not
inverse operations, and not from frame 0.**
*(Revised — the original "always replay from frame 0" breaks down at the 50k-frame limit
and for DP/N-Queens-scale recordings.)*
Rationale: the reducer is pure, so `checkpoint + replay ≤ 200 frames` is cheap and exact;
inverse ops double the engine's surface for zero user-visible gain.

**D-9 · Pre-collect all frames on input change (bounded by 50k-step budget).**
Rationale: enables the scrubber and step-back; also the exact mechanism that makes
infinite loops in Exercise safe (truncate + banner).
Rejected: true live streaming of generator output (only needed for huge inputs; not v1).

**D-10 · Exercise visible in nav from day one as "coming soon".**
Rationale: nav is a product requirement; placeholder sets expectations and keeps the
information architecture stable.

**D-11 · Graph layouts are hand-authored coordinates per example, not force-directed.**
Rationale: teaching demos need stable, readable layouts; force layouts jiggle and differ
per run. Rejected: d3-force (revisit only for user-defined graphs).

---

*D-12 through D-19 come from the pre-implementation architecture review (2026-07-20),
which found the v1 protocol conflated element identity with position and underestimated
the Worker sandbox. Full details in ARCHITECTURE.md.*

**D-12 · Element identity (`EntityId`) and position (`Location`) are separate types; the
model owns the `Location → EntityId` occupancy map.**
Rationale: Exercise's Proxy instrumentation observes *positions* (`arr[3] = x`), but
animation needs *identities* (which element moved). One `Id` for both breaks on swaps,
duplicate values, and position writes. Rejected: value-based identity guessing (fails on
duplicates), keeping index-as-id (fails after first swap).

**D-13 · Three-layer event protocol: Frame metadata (`line`/`note`/`pace`) · model
operations (mutate data) · annotations (visual only). `line`/`note` live on the Frame,
never on individual steps.**
Rationale: v1's flat Step union couldn't express tree left/right, weighted directed
edges, multiple collections, grid cells, mark-clearing, or heap projections — and a Frame
with steps carrying different `line`s was ambiguous. Rejected: growing the flat union
case-by-case (same ambiguities, more members).

**D-14 · Exercise sandbox: fresh worker per test case; network APIs neutered in the
prelude + CSP backup; RawOps streamed in batches so timeouts keep partial recordings;
four independent limits (3 s wall / 200k ops / 50k frames / 5 MB).**
Rationale: Workers are not network-isolated by default, and v1's post-at-end design lost
the entire recording exactly when it mattered most (infinite loops). Op-count alone
cannot catch loops that never touch the instrumented array — wall time can.

**D-15 · Five protocol fixtures (Bubble Sort, Binary Search, Reverse Linked List,
Dijkstra, N-Queens) gate mass production of algorithms.**
Rationale: they span all five data shapes; a protocol that expresses all five cleanly
won't need a rewrite at algorithm #37. Fixing the protocol in Phase 0 costs hours;
fixing it in Phase 2 costs a rewrite of every shipped module.

**D-16 · Phase 0 is an engine contract spike; product UI is Phase 0B. Phase 1 splits
into 1A/1B/1C. PHASES.md is the single source of truth for scope and exit criteria.**
Rationale: the original Phase 0 bundled unstable engine contracts with a polished page —
early work would stall on UI polish instead of stabilizing semantics; and PLAN/PHASES
disagreed on Phase 1's size (15 vs 22 algos). Rejected: 22-algo mega-phase (nothing
mergeable for weeks, violating one-concern-per-branch).

**D-17 · Edge-case inputs, input schemas, and oracle checks are part of the day-one
`AlgoModule` contract, validated by a registry-level test suite; performance exit
criteria are measurable (fixed fixture, dropped-frame ratio, long-task threshold,
bundle gate).**
Rationale: generator/scrubber/range semantics depend on edge inputs from Phase 0, so
"edge cases in Phase 2" was too late; and "60fps" without a measurement protocol is
unfalsifiable. 50 pages of content cannot be hand-audited — the schema suite is the audit.

**D-18 · Color-language fixes: swap (rose, transient) and error (crimson, persistent,
shake + ✕) are distinct states; `discard` gets its own token; active vs path share yellow
but are discriminated by second channel (pulse vs outline + trail). Never autoplay.**
Rationale: v1 used red for swap *and* mismatch *and* conflict, breaking the global color
language; `discard` had no token at all.

**D-19 · CLAUDE.md is canonical for agent instructions; AGENTS.md is a pointer to it.**
Rationale: the two files were near-identical copies and would silently drift. One
canonical file, one pointer — tools that auto-read either name still land on the same
content.

**D-20 · (Second review pass, 2026-07-20) Phase 2B split into 2B Trees & Heap / 2C
Graphs / 2D DP + Backtracking; Phase 3 split into 3A Sandbox + Normalizer / 3B UI Shell /
3C First 5 Exercises. Heap Sort in Phase 1A uses a minimal `HeapStripView` (arithmetic
complete-binary-tree layout only), explicitly not an early TreeView. `edgeUnmark` added
to the protocol so every persistent annotation has an inverse.**
Rationale: 2B at 20 algos + three renderers concentrated too much renderer risk in one
branch; Phase 3 was a mini-product bundling sandbox correctness with editor UI. The
HeapStripView constraint stops TreeView capability from leaking into 1A ungoverned.
Without `edgeUnmark`, Dijkstra-style path tracing accumulates stale edge state — the
Dijkstra fixture must exercise it.
