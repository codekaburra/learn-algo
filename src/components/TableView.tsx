import { orderedIndices, type ViewState } from '../engine/reduce';

interface Props {
  state: ViewState;
}

// Non-visual equivalent of the SVG: the current ViewState as an HTML table (a11y).
export default function TableView({ state }: Props) {
  const cols = Object.keys(state.collections);
  return (
    <div className="table-view glass">
      <div className="code-head label">Table view</div>
      {cols.length === 0 && <p className="state-empty">No data yet.</p>}
      {cols.map((col) => {
        const items = orderedIndices(state, col);
        if (items.length === 0) return null;
        return (
          <table key={col} className="data-table mono">
            <caption className="label">{col}</caption>
            <thead>
              <tr>
                <th>index</th>
                {items.map((it) => (
                  <th key={it.id}>{it.index}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>value</td>
                {items.map((it) => (
                  <td key={it.id}>{String(state.entities[it.id]?.value)}</td>
                ))}
              </tr>
              <tr>
                <td>mark</td>
                {items.map((it) => (
                  <td key={it.id}>{state.marks[it.id] ?? '·'}</td>
                ))}
              </tr>
            </tbody>
          </table>
        );
      })}
    </div>
  );
}
