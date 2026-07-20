# DESIGN.md — Visual Design System

Theme in three words: **dark, colorful, glass.**
The chrome (backgrounds, panels, nav) is dark and quiet; the **data is the color**. Algorithm
elements are vivid and glowing so the eye is always drawn to what the algorithm is doing.

## 1. Color system

### Base (the dark canvas)
| Token | Value | Use |
|---|---|---|
| `--bg-0` | `#07080f` | Page background (near-black, slightly blue) |
| `--bg-1` | `#0d1020` | Section background / large surfaces |
| `--glass` | `rgba(255,255,255,0.06)` | Glass panel fill |
| `--glass-border` | `rgba(255,255,255,0.12)` | 1px glass panel border |
| `--text-hi` | `#f2f4ff` | Headings, primary text |
| `--text-lo` | `#8b90a8` | Secondary text, labels |

Add a subtle fixed background: 2–3 large, very blurred radial gradient blobs (category accent
colors at ~8% opacity) behind everything, so glass panels have something to refract.

### Category accents (each algorithm category owns a color)
| Category | Accent | Glow |
|---|---|---|
| Arrays & Two Pointers | `#22d3ee` cyan | `rgba(34,211,238,.45)` |
| Sorting | `#a78bfa` violet | `rgba(167,139,250,.45)` |
| Searching | `#34d399` emerald | `rgba(52,211,153,.45)` |
| Linked List | `#fb7185` rose | `rgba(251,113,133,.45)` |
| Stack & Queue | `#fbbf24` amber | `rgba(251,191,36,.45)` |
| Trees | `#4ade80` green | `rgba(74,222,128,.45)` |
| Heap | `#f472b6` pink | `rgba(244,114,182,.45)` |
| Graphs | `#60a5fa` blue | `rgba(96,165,250,.45)` |
| Dynamic Programming | `#e879f9` fuchsia | `rgba(232,121,249,.45)` |
| Backtracking | `#fb923c` orange | `rgba(251,146,60,.45)` |
| Greedy | `#2dd4bf` teal | `rgba(45,212,191,.45)` |

The category accent tints its cards (border glow on hover), the algorithm page header, and is
the default element color in that category's visualizations.

### Animation state colors (used inside every visualization, consistent site-wide)

Every state token maps 1:1 to a protocol mark/flash state (ARCHITECTURE.md Layer 3).

| State | Color | Second channel | Meaning |
|---|---|---|---|
| `--el-idle` | category accent at 55% saturation | — | untouched element |
| `--el-active` | `#facc15` yellow | pulsing glow | currently being read/compared |
| `--el-compare` | `#f97316` orange | glow | second element in a comparison |
| `--el-swap` | `#f43f5e` rose | brief flash, always paired with swap motion | elements mid-swap |
| `--el-error` | `#dc2626` crimson | shake + ✕ glyph, persists until cleared | mismatch / conflict / invalid (parenthesis mismatch, queen conflict) |
| `--el-sorted` | `#22c55e` green | — | finalized / in correct place |
| `--el-pointer` | white | ring + chevron + name label | pointer markers (i, j, lo, hi, slow, fast) |
| `--el-visited` | dimmed accent 35% | reduced opacity | visited (graphs/trees) |
| `--el-discard` | dimmed accent 20% | desaturated + shrunk 0.92 | eliminated from consideration (binary search halves) |
| `--el-path` | `#facc15` yellow | solid outline ring + connecting trail line | discovered path / final answer |

**Rules:**
- Same state = same color on every page. The user learns the color language once.
- **Red family is split**: `--el-swap` (rose, transient, motion-paired) vs `--el-error`
  (crimson, persistent, shake + ✕). Never use one for the other's meaning.
- `--el-active` and `--el-path` share yellow but never appear ambiguously: active is a
  transient glow pulse on one element; path is a persistent outline + trail across many.
  The second channel, not the hue, is the discriminator — this also covers color-blind users.

## 2. Glassmorphism recipe

Every panel (cards, viz panel, code panel, controls bar) uses:

```css
background: rgba(255, 255, 255, 0.06);
backdrop-filter: blur(16px) saturate(140%);
border: 1px solid rgba(255, 255, 255, 0.12);
border-radius: 16px;
box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
```

- Hover on interactive cards: border shifts to the category accent at 40% opacity + soft
  outer glow (`box-shadow: 0 0 24px var(--glow)`), translateY(-2px), 150ms ease.
- Never stack more than two glass layers — blur-on-blur kills performance and readability.
- Provide a `@supports not (backdrop-filter: blur(1px))` fallback: solid `rgba(13,16,32,0.9)`.

## 3. Typography
- UI: **Inter** (or system-ui fallback). Headings 600–700 weight, tight tracking.
- Code & data values: **JetBrains Mono**. Every number inside a visualization is mono.
- Sizes: page title 32px, section 20px, body 15px, labels 12px uppercase +0.08em tracking
  in `--text-lo`.

## 4. Motion rules (the heart of the site)

- **Element movement** (swaps, insertions, node traversal): animate `transform` only
  (translate/scale), 280ms, `cubic-bezier(0.22, 1, 0.36, 1)`. Never animate layout properties.
- **Light-up** (compare/visit): 120ms color+glow fade-in, hold while active, 200ms fade-out.
  Glow = `filter: drop-shadow(0 0 8px <state color>)`.
- **Swap** choreography: both elements lift (scale 1.08, brighten), glide past each other in
  arcs (one over, one under), settle with a tiny 1.02 bounce.
- **Pointer moves**: pointers slide (not jump) to the next index, 180ms.
- Speed slider scales all durations; at ≥ 2× drop glows and arcs, keep only position
  changes, so it remains readable and cheap. The player's logical cursor never advances
  before the current frame's animation completes, at any speed.
- Playback controls are icon buttons in a glass pill bar; active state uses category accent.
- **Never autoplay.** Pages load paused at frame 0; the Play button gets a subtle
  attention pulse instead. (Motion the user didn't request is disorienting and hostile
  under screen readers.)
- Respect `prefers-reduced-motion`: discrete state changes, no positional animation,
  color/label feedback only; default speed steps down one notch.

## 5. Layout

### Nav bar
- Sticky top, full-width glass bar (blur over the moving content beneath is the signature look).
- Left: logo mark (simple geometric, accent gradient). Center/left: **Academy · Exercise**
  links with active underline in accent gradient. Right: search icon, GitHub link.

### Academy catalog
- Category sections in order of ALGORITHMS.md, each with a colored heading chip.
- Responsive card grid (min card 260px). Card: algorithm name, tiny static preview glyph
  (SVG thumbnail of the data shape), difficulty dot (green/amber/red), complexity badge
  (`O(n log n)` in mono), category-colored left border.

Tablet (≤ 1024px): code + state panels stack **below** the visualization; playback bar
stays sticky above the fold. Touch targets throughout ≥ 44×44 px. (Phone is explicitly
best-effort in v1 — must not break, not optimized.)

### Algorithm page (desktop)
```
┌────────────────────────────── nav ──────────────────────────────┐
│ ← Back · Category chip · Algorithm title · difficulty · O(...)  │
├───────────────────────────────┬─────────────────────────────────┤
│                               │  Code panel (line-highlight     │
│   Visualization panel (65%)   │  synced to animation)           │
│                               ├─────────────────────────────────┤
│                               │  State panel (vars, pointers)   │
├───────────────────────────────┴─────────────────────────────────┤
│        ⏮  ◀  ▶/⏸  ▶▶  speed ───○───  scrubber ────────○──       │
├─────────────────────────────────────────────────────────────────┤
│  Explanation: pattern, when to use, pitfalls, complexity        │
└─────────────────────────────────────────────────────────────────┘
```

### Exercise page (Phase 3)
- Left half: problem statement (top) + Monaco editor (bottom).
- Right half: the same visualization panel + playback bar as Academy, replaying the
  user's recorded run. Test results strip beneath.

## 6. Accessibility
- All state colors must also differ by a secondary channel (see the state table's
  "second channel" column) — never color alone. Verify contrast ≥ 4.5:1 for text on glass.
- Full keyboard control of playback: Space = play/pause, ←/→ = step, ↑/↓ = speed.
  Shortcuts are active **only when focus is outside inputs, textareas, and the Monaco
  editor** — typing space in the editor must never toggle playback.
- **Narration live region**: an `aria-live="polite"` region announces the current frame's
  `note` (or a generated fallback like "compare index 3 and 4") while playing at 1× or
  stepping. Suppressed at ≥ 2× to avoid flooding.
- **Data-table alternative**: every visualization offers a "table view" toggle rendering
  the current ViewState as an HTML table (collection values + marks + pointers) — the
  non-visual equivalent of the SVG, driven by the same reducer output.
- Focus order: nav → page header → visualization controls → code panel → explanation.
  Skip link ("skip to controls") as first focusable. Every icon button has an
  `aria-label`; the scrubber is a labeled `range` input announcing "frame n of m".
