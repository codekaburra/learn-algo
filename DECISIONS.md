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

**D-3 · React + TypeScript + Vite + Tailwind + Framer Motion.**
Rationale: the most widely known stack — any builder AI or human contributor is productive
immediately; static output; Framer Motion's layout animations map directly to swap arcs.
Rejected: Svelte (great fit but smaller ecosystem), Next.js (no server needed; acceptable
substitute if builder prefers, but must remain a fully static export).

**D-4 · Fully static site, no backend, progress in localStorage.**
Rationale: zero ops cost, instant deploys, nothing to secure; v1 has no data worth syncing.
Rejected: accounts + database (deferred to Phase 4 "optional" at the earliest).

**D-5 · Pattern-based classification, 11 categories, 50 algorithms (ALGORITHMS.md).**
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

**D-8 · Step-back implemented by replaying frames from the start, not inverse operations.**
Rationale: inputs are ≤100 elements, replay is microseconds; inverse ops double the
engine's surface for zero user-visible gain at this scale.

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
