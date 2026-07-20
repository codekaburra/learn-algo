# CLAUDE.md — AlgoLab

An interactive, animated algorithm learning site. Dark mode, colorful, glassmorphism.
See [PLAN.md](PLAN.md) for the vision and the index of all planning documents.

## Git workflow (follow this every time)

**`main` holds only planning, scaffolding, and merged work. All real feature work happens
on a branch.**

1. **Planning before code.** Planning and design documents are committed to `main` on their
   own, before implementation starts. When a plan changes, commit the document change
   separately from the code that implements it.
2. **Commit scaffolding as-is.** When a tool generates a project skeleton
   (`npm create vite`, `npx shadcn init`, etc.), commit its untouched output as its own
   commit before customizing it. This keeps a clean baseline so later diffs show only our
   own decisions, never the generator's boilerplate.
3. **Branch for every feature.** Never commit feature work directly to `main`. Branch names:
   - `feat/<slug>` — new functionality (`feat/step-engine`, `feat/array-view`)
   - `fix/<slug>` — bug fixes
   - `docs/<slug>` — documentation-only changes
   - `chore/<slug>` — tooling, dependencies, config
4. **One phase or one concern per branch.** Phases are defined in [PHASES.md](PHASES.md).
   Do not mix an engine change and a new algorithm in one branch.
5. **Verify before merging.** A branch merges only when it builds, type-checks, and meets
   the exit criteria written for its phase in PHASES.md.

### Commit messages
Conventional-commit prefix, imperative subject under ~70 characters, then a body
explaining *why* when it is not obvious. Every commit ends with:

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

## Architectural rules (do not violate without logging a decision)

- **Algorithms never touch the DOM.** Each algorithm is a generator yielding `Frame`s of
  step events; renderers only consume those events. This is what lets Academy and Exercise
  share one animation system — see [ARCHITECTURE.md](ARCHITECTURE.md).
- **The state-color language is global.** Yellow = active/comparing, orange = second in
  comparison, red = swapping, green = sorted/final. Same meaning on every page. Colors and
  tokens live in [DESIGN.md](DESIGN.md) and are defined once as CSS variables.
- **Static site, no backend.** Progress lives in localStorage.
- **Dark mode only.** No theme toggle.
- **Log decisions.** Any choice that contradicts or extends the planning documents gets
  appended to [DECISIONS.md](DECISIONS.md) rather than made silently.

## Commands

```bash
npm install      # install dependencies
npm run dev      # dev server
npm run build    # type-check + production build
npm run preview  # serve the production build
```
