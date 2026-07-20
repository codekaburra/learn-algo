import type { ViewState } from '../engine/reduce';

interface Props {
  state: ViewState;
}

export default function StatePanel({ state }: Props) {
  const entries = Object.entries(state.vars);
  const pointers = Object.entries(state.pointers).filter(([, v]) => v !== null);

  return (
    <div className="state-panel glass" aria-label="algorithm state">
      <div className="code-head label">State</div>
      <div className="state-body">
        {entries.length === 0 && pointers.length === 0 && (
          <div className="state-empty">Press play or step to begin.</div>
        )}
        {entries.map(([k, v]) => (
          <div className="state-row" key={k}>
            <span className="state-key mono">{k}</span>
            <span className="state-val mono">{String(v)}</span>
          </div>
        ))}
        {pointers.map(([name, loc]) => (
          <div className="state-row" key={`ptr-${name}`}>
            <span className="state-key mono">ptr {name}</span>
            <span className="state-val mono">
              {loc && loc.kind === 'index'
                ? `index ${loc.index}`
                : loc && loc.kind === 'node'
                  ? `node ${loc.node}`
                  : loc && loc.kind === 'cell'
                    ? `(${loc.row}, ${loc.column})`
                    : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
