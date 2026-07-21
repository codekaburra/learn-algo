import type { Annotation, Frame, ModelOp } from '../../engine/protocol';
import { nodeLoc } from '../../engine/protocol';
import type { ViewState } from '../../engine/reduce';
import { vars } from '../helpers';
import { randomIntArray, type AlgoModule } from '../types';

const code = `function reverse(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`;

const nodeId = (i: number) => `n${i}`;
const entId = (i: number) => `e${i}`;

function nodePtr(name: string, node: string | null): Annotation {
  return {
    an: 'pointer',
    name,
    at: node === null ? null : nodeLoc('main', node),
  };
}

function* run(input: unknown): Generator<Frame> {
  const values = input as number[];
  const n = values.length;

  const setup: ModelOp[] = [{ op: 'collection', id: 'main', shape: 'list' }];
  values.forEach((v, i) => {
    setup.push({ op: 'create', id: entId(i), value: v, at: nodeLoc('main', nodeId(i)) });
  });
  for (let i = 0; i < n - 1; i++) {
    setup.push({ op: 'link', from: nodeId(i), to: nodeId(i + 1), rel: 'next' });
  }
  yield { ops: setup, line: 1, note: 'A singly linked list' };

  if (n === 0) {
    yield { line: 10, note: 'Empty list — nothing to reverse', annotate: [vars({ result: 'null' })] };
    return;
  }

  // prev/curr/next tracked as node indices; -1 means null.
  let prev = -1;
  let curr = 0;
  yield {
    annotate: [nodePtr('prev', null), nodePtr('curr', nodeId(curr)), vars({ prev: 'null', curr: values[curr] })],
    line: 3,
    note: 'prev = null, curr = head',
  };

  while (curr !== -1) {
    const next = curr < n - 1 ? curr + 1 : -1;
    yield {
      annotate: [
        nodePtr('next', next === -1 ? null : nodeId(next)),
        { an: 'flash', targets: [entId(curr)], state: 'active' },
        vars({ next: next === -1 ? 'null' : values[next] }),
      ],
      line: 5,
      note: 'next = curr.next',
    };

    const ops: ModelOp[] = [];
    // curr.next = prev : remove the old forward edge, add the reversed edge.
    if (next !== -1) ops.push({ op: 'unlink', from: nodeId(curr), to: nodeId(next), rel: 'next' });
    if (prev !== -1) ops.push({ op: 'link', from: nodeId(curr), to: nodeId(prev), rel: 'next' });
    yield { ops, line: 6, note: 'curr.next = prev — flip the arrow' };

    prev = curr;
    curr = next;
    yield {
      annotate: [
        nodePtr('prev', nodeId(prev)),
        nodePtr('curr', curr === -1 ? null : nodeId(curr)),
        vars({ prev: values[prev], curr: curr === -1 ? 'null' : values[curr] }),
      ],
      line: 8,
      note: 'Advance prev and curr',
    };
  }
  yield {
    annotate: [nodePtr('curr', null), { an: 'mark', target: entId(prev), state: 'path' }, vars({ result: values[prev] })],
    line: 10,
    note: 'curr is null — prev is the new head',
  };
}

// Follow next-links from the head to read the list order out of final ViewState.
function listOrder(final: ViewState): number[] {
  const next: Record<string, string> = {};
  const hasIncoming = new Set<string>();
  const nodesWithEntity = new Set<string>();
  for (const [id, loc] of Object.entries(final.entityLoc)) {
    if (loc.kind === 'node') nodesWithEntity.add(loc.node);
    void id;
  }
  for (const e of Object.values(final.edges)) {
    if (e.rel === 'next') {
      next[e.from] = e.to;
      hasIncoming.add(e.to);
    }
  }
  const head = [...nodesWithEntity].find((nd) => !hasIncoming.has(nd));
  const out: number[] = [];
  let cur = head;
  const seen = new Set<string>();
  const nodeToVal: Record<string, number> = {};
  for (const [id, loc] of Object.entries(final.entityLoc)) {
    if (loc.kind === 'node') nodeToVal[loc.node] = final.entities[id].value as number;
  }
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    out.push(nodeToVal[cur]);
    cur = next[cur];
  }
  return out;
}

const reverseLinkedList: AlgoModule = {
  meta: {
    slug: 'reverse-linked-list',
    title: 'Reverse Linked List',
    category: 'Linked List',
    paradigm: ['Data-structure operations'],
    difficulty: 'easy',
    complexity: { time: 'O(n)', space: 'O(1)' },
    explanation: `**What:** Walk the list once, re-pointing each node's \`next\` to the node before it. Three pointers — \`prev\`, \`curr\`, \`next\` — keep the traversal from losing the rest of the list.

**When:** A fundamental list manipulation; a subroutine in palindrome checks, reordering, and k-group reversal.

**Pitfalls:** Save \`curr.next\` *before* overwriting it, or you lose the tail. Return \`prev\` (the new head), not \`curr\` (which ends as null).`,
    lights: 'arrows flip one by one, prev/curr/next pointers',
  },
  code,
  renderer: 'linked-list',
  input: {
    schema: { kind: 'int-array', maxVisualSize: 8, note: 'list node values' },
    default: () => [1, 2, 3, 4, 5],
    random: (seed) => randomIntArray(seed, 5, 9, 1),
    edges: {
      empty: [],
      single: [7],
      duplicates: [3, 3, 3],
    },
  },
  run,
  expect: {
    result: (input) => (input as number[]).slice().reverse(),
    invariants: [
      (final) => {
        const order = listOrder(final);
        return order.length === Object.keys(final.entities).length;
      },
    ],
  },
};

export { listOrder };
export default reverseLinkedList;
