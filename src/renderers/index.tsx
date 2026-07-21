import type { ViewState } from '../engine/reduce';
import type { AlgoModule, RendererKind } from '../algos/types';
import ArrayView from './ArrayView';
import HeapStripView from './HeapStripView';

interface Props {
  module: AlgoModule;
  state: ViewState;
  simplified: boolean;
}

// Dispatch a ViewState to the renderer(s) declared by the module. Additional
// projections in module.views render as synchronized strips beneath the primary.
export default function Renderer({ module, state, simplified }: Props) {
  const primary = renderOne(module.renderer, state, simplified, 'main');

  const extraViews = (module.views ?? []).filter((v) => v.col !== 'main' || v.as !== module.renderer);

  return (
    <div className="viz-stack">
      {primary}
      {extraViews.map((v) => (
        <div className="viz-strip" key={`${v.col}-${v.as}`}>
          {v.label && <div className="label viz-strip-label">{v.label}</div>}
          {renderOne(v.as, state, simplified, v.col)}
        </div>
      ))}
    </div>
  );
}

function renderOne(
  kind: RendererKind,
  state: ViewState,
  simplified: boolean,
  col: string,
) {
  switch (kind) {
    case 'array-bars':
      return <ArrayView state={state} col={col} mode="bars" simplified={simplified} />;
    case 'array-boxes':
      return <ArrayView state={state} col={col} mode="boxes" simplified={simplified} />;
    case 'heap-strip':
      return <HeapStripView state={state} col={col} simplified={simplified} />;
    case 'stack-queue':
      // Small strip fallback until StackQueueView lands (Phase 2A).
      return <ArrayView state={state} col={col} mode="boxes" simplified={simplified} height={120} />;
    default:
      return (
        <div className="viz-placeholder glass">
          <p>
            The <code>{kind}</code> renderer is not wired yet. Use the table view below to
            inspect the current state.
          </p>
        </div>
      );
  }
}
