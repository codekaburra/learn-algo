import { describe, expect, it } from 'vitest';
import { emptyViewState, orderedIndices, reduce, type ViewState } from '../engine/reduce';
import { modules } from './registry';
import type { AlgoModule, Category } from './types';

const INDEX_RENDERERS = new Set(['array-bars', 'array-boxes', 'heap-strip']);

type EdgeName = keyof AlgoModule['input']['edges'];

// Acceptance edge cases a module MUST declare, keyed by category. Sorting has to
// prove all five; array/search modules must at least cover the single-element case.
// Categories absent here have algorithm-specific inputs and declare edges ad hoc.
const REQUIRED_EDGES: Partial<Record<Category, EdgeName[]>> = {
  Sorting: ['empty', 'single', 'duplicates', 'sorted', 'reversed'],
  'Arrays & Two Pointers': ['single'],
  Searching: ['single'],
};

function replay(mod: AlgoModule, input: unknown): ViewState {
  let s = emptyViewState();
  let count = 0;
  for (const f of mod.run(input)) {
    s = reduce(s, f);
    if (++count > 60_000) throw new Error(`${mod.meta.slug} exceeded frame budget`);
  }
  return s;
}

function orderedMain(s: ViewState): number[] {
  return orderedIndices(s, 'main').map(({ id }) => s.entities[id].value as number);
}

function inputsFor(mod: AlgoModule): { name: string; input: unknown }[] {
  const out = [{ name: 'default', input: mod.input.default() }];
  for (const [name, input] of Object.entries(mod.input.edges)) {
    if (input !== undefined) out.push({ name, input });
  }
  out.push({ name: 'random', input: mod.input.random(12345) });
  return out;
}

describe('registry content-schema', () => {
  for (const mod of modules) {
    describe(mod.meta.slug, () => {
      it('has complete metadata', () => {
        const { meta } = mod;
        expect(meta.slug).toBeTruthy();
        expect(meta.title).toBeTruthy();
        expect(meta.category).toBeTruthy();
        expect(meta.paradigm.length).toBeGreaterThan(0);
        expect(['easy', 'medium', 'hard']).toContain(meta.difficulty);
        expect(meta.complexity.time).toBeTruthy();
        expect(meta.complexity.space).toBeTruthy();
        expect(meta.explanation.length).toBeGreaterThan(40);
        expect(meta.lights.length).toBeGreaterThan(5);
        expect(mod.code.trim().length).toBeGreaterThan(0);
      });

      it('frame lines stay within the code listing', () => {
        const lineCount = mod.code.split('\n').length;
        for (const f of mod.run(mod.input.default())) {
          if (f.line !== undefined) {
            expect(f.line).toBeGreaterThanOrEqual(1);
            expect(f.line).toBeLessThanOrEqual(lineCount);
          }
        }
      });

      it('declares its required acceptance edge cases', () => {
        const required = REQUIRED_EDGES[mod.meta.category] ?? [];
        for (const name of required) {
          expect(
            mod.input.edges[name],
            `${mod.meta.slug} must declare the '${String(name)}' edge case`,
          ).toBeDefined();
        }
      });

      it('replays every declared input without throwing', () => {
        for (const { input } of inputsFor(mod)) {
          expect(() => replay(mod, input)).not.toThrow();
        }
      });

      it('matches its result oracle', () => {
        if (!mod.expect.result) return;
        for (const { name, input } of inputsFor(mod)) {
          const final = replay(mod, input);
          const oracle = mod.expect.result(input);
          if (Array.isArray(oracle)) {
            if (INDEX_RENDERERS.has(mod.renderer)) {
              expect(orderedMain(final), `${mod.meta.slug}/${name}`).toEqual(oracle);
            }
          } else {
            expect(final.vars.result, `${mod.meta.slug}/${name}`).toEqual(oracle);
          }
        }
      });

      it('satisfies its invariants', () => {
        if (!mod.expect.invariants) return;
        const final = replay(mod, mod.input.default());
        for (const inv of mod.expect.invariants) expect(inv(final)).toBe(true);
      });
    });
  }
});
