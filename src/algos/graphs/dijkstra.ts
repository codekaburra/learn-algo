import type { Annotation, Frame, ModelOp } from '../../engine/protocol';
import { idx, nodeLoc } from '../../engine/protocol';
import { vars } from '../helpers';
import type { AlgoModule } from '../types';

const code = `function dijkstra(graph, src, target) {
  const dist = {}; for (const v of graph.nodes) dist[v] = Infinity;
  dist[src] = 0;
  const pq = new MinHeap([[0, src]]);
  while (!pq.empty()) {
    const [d, u] = pq.pop();
    if (d > dist[u]) continue;
    for (const [v, w] of graph.adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        parent[v] = u;
        pq.push([dist[v], v]);
      }
    }
  }
  return dist[target];
}`;

interface GraphInput {
  nodes: string[];
  adj: Record<string, [string, number][]>;
  src: string;
  target: string;
}

const defaultGraph: GraphInput = {
  nodes: ['A', 'B', 'C', 'D', 'E', 'F'],
  adj: {
    A: [['B', 4], ['C', 1]],
    B: [['E', 1]],
    C: [['B', 2], ['D', 5]],
    D: [['E', 3], ['F', 2]],
    E: [['F', 4]],
    F: [],
  },
  src: 'A',
  target: 'F',
};

const layout: Record<string, { x: number; y: number }> = {
  A: { x: 0.1, y: 0.5 },
  B: { x: 0.38, y: 0.2 },
  C: { x: 0.38, y: 0.8 },
  D: { x: 0.66, y: 0.8 },
  E: { x: 0.66, y: 0.2 },
  F: { x: 0.92, y: 0.5 },
};

function reference(input: GraphInput): Record<string, number> {
  const { nodes, adj, src } = input;
  const dist: Record<string, number> = {};
  for (const v of nodes) dist[v] = Infinity;
  dist[src] = 0;
  const visited = new Set<string>();
  while (visited.size < nodes.length) {
    let u: string | null = null;
    let best = Infinity;
    for (const v of nodes) if (!visited.has(v) && dist[v] < best) (best = dist[v]), (u = v);
    if (u === null) break;
    visited.add(u);
    for (const [v, w] of adj[u]) if (dist[u] + w < dist[v]) dist[v] = dist[u] + w;
  }
  return dist;
}

function distString(dist: Record<string, number>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(dist)) out[`d(${k})`] = v === Infinity ? '∞' : String(v);
  return out;
}

function* run(input: unknown): Generator<Frame> {
  const g = input as GraphInput;
  const { nodes, adj, src, target } = g;

  const setup: ModelOp[] = [{ op: 'collection', id: 'main', shape: 'graph' }];
  nodes.forEach((v) => setup.push({ op: 'create', id: v, value: v, at: nodeLoc('main', v) }));
  for (const u of nodes) {
    for (const [v, w] of adj[u]) {
      setup.push({
        op: 'link',
        from: u,
        to: v,
        rel: 'edge',
        edge: { id: `${u}${v}`, directed: true, weight: w },
      });
    }
  }
  setup.push({ op: 'collection', id: 'pq', shape: 'queue', label: 'priority queue' });

  const dist: Record<string, number> = {};
  for (const v of nodes) dist[v] = Infinity;
  dist[src] = 0;
  const parent: Record<string, string> = {};

  yield {
    ops: setup,
    annotate: [vars({ ...distString(dist) })],
    line: 2,
    note: `Weighted directed graph; find shortest path ${src} → ${target}`,
  };

  const visited = new Set<string>();
  // simple array-based frontier for teaching clarity
  const frontier: string[] = [src];

  // Rebuild the priority-queue strip to match the current frontier: destroy the
  // previous entities and recreate one per frontier entry at contiguous indices,
  // ordered by tentative distance. This keeps the strip shrinking on pop and never
  // skips a slot (a plain create-on-push leaks entities and leaves index gaps).
  let pqIds: string[] = [];
  let pqSeq = 0;
  const pqSyncOps = (): ModelOp[] => {
    const ops: ModelOp[] = pqIds.map((id) => ({ op: 'destroy', id }));
    pqIds = [];
    [...frontier]
      .sort((a, b) => dist[a] - dist[b])
      .forEach((v, i) => {
        const id = `pq-${pqSeq++}`;
        pqIds.push(id);
        ops.push({
          op: 'create',
          id,
          value: `${v}:${dist[v] === Infinity ? '∞' : dist[v]}`,
          at: idx('pq', i),
        });
      });
    return ops;
  };

  yield {
    ops: pqSyncOps(),
    annotate: [{ an: 'flash', targets: [src], state: 'active' }, vars({ ...distString(dist) })],
    line: 4,
    note: `Push source ${src} with distance 0`,
  };

  while (frontier.length > 0) {
    frontier.sort((a, b) => dist[a] - dist[b]);
    const u = frontier.shift()!;
    if (visited.has(u)) continue;
    visited.add(u);

    yield {
      ops: pqSyncOps(),
      annotate: [
        { an: 'flash', targets: [u], state: 'active' },
        { an: 'mark', target: u, state: 'visited' },
        vars({ ...distString(dist), current: u }),
      ],
      line: 6,
      note: `Pop ${u} (distance ${dist[u]}) — finalise it`,
    };

    for (const [v, w] of adj[u]) {
      const nd = dist[u] + w;
      yield {
        annotate: [
          { an: 'flash', targets: [v], state: 'compare' },
          { an: 'edgeMark', from: u, to: v, state: 'visited' },
          vars({ ...distString(dist), relaxing: `${u}→${v} (+${w})` }),
        ],
        line: 8,
        note: `Relax edge ${u}→${v}: ${dist[u]} + ${w} = ${nd} vs ${dist[v] === Infinity ? '∞' : dist[v]}`,
      };
      if (nd < dist[v]) {
        const annotate: Annotation[] = [];
        // A better path replaces any previous tentative tree edge into v.
        if (parent[v] !== undefined && parent[v] !== u) {
          annotate.push({ an: 'edgeUnmark', from: parent[v], to: v });
        }
        dist[v] = nd;
        parent[v] = u;
        annotate.push({ an: 'edgeMark', from: u, to: v, state: 'path' });
        annotate.push(vars({ ...distString(dist), updated: `${v}=${nd}` }));
        frontier.push(v);
        yield {
          ops: pqSyncOps(),
          annotate,
          line: 11,
          note: `Better path to ${v}: dist = ${nd}, parent = ${u}`,
        };
      } else {
        yield {
          annotate: [{ an: 'edgeUnmark', from: u, to: v }],
          line: 8,
          note: `No improvement for ${v}`,
        };
      }
    }
  }

  // Trace the final shortest path to the target.
  const pathEdges: Annotation[] = [];
  let cur = target;
  while (parent[cur] !== undefined) {
    pathEdges.push({ an: 'edgeMark', from: parent[cur], to: cur, state: 'path' });
    pathEdges.push({ an: 'mark', target: cur, state: 'path' });
    cur = parent[cur];
  }
  pathEdges.push({ an: 'mark', target: src, state: 'path' });
  yield {
    annotate: [...pathEdges, vars({ ...distString(dist), result: dist[target] === Infinity ? -1 : dist[target] })],
    line: 15,
    note: `Shortest distance ${src} → ${target} = ${dist[target]}`,
  };
}

const dijkstra: AlgoModule = {
  meta: {
    slug: 'dijkstra',
    title: 'Dijkstra Shortest Path',
    category: 'Graphs',
    paradigm: ['Greedy', 'Graph theory'],
    difficulty: 'hard',
    complexity: { time: 'O(E log V)', space: 'O(V)' },
    explanation: `**What:** Grow a set of finalised vertices outward from the source, always finalising the closest unfinalised vertex next. Each pop "relaxes" its outgoing edges, lowering tentative distances.

**When:** Single-source shortest paths on graphs with **non-negative** edge weights.

**Pitfalls:** Fails with negative edges (use Bellman–Ford). Skip stale heap entries (\`if (d > dist[u]) continue\`). The greedy choice is only safe because no later, longer path can undercut an already-finalised distance.`,
    lights: 'tentative distances relax, final path traces yellow',
  },
  code,
  renderer: 'graph',
  viz: { layout },
  views: [
    { col: 'main', as: 'graph' },
    { col: 'pq', as: 'stack-queue', label: 'priority queue' },
  ],
  input: {
    schema: { kind: 'graph', note: 'weighted directed graph' },
    default: () => defaultGraph,
    random: () => defaultGraph,
    edges: {},
  },
  run,
  expect: {
    result: (input) => {
      const g = input as GraphInput;
      const dist = reference(g);
      return dist[g.target] === Infinity ? -1 : dist[g.target];
    },
  },
};

export default dijkstra;
