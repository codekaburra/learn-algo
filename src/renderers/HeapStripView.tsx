import { orderedIndices, type ViewState } from '../engine/reduce';
import type { CollectionId } from '../engine/protocol';
import { entityVisual } from './colors';

interface Props {
  state: ViewState;
  col?: CollectionId;
  simplified?: boolean;
  height?: number;
}

const W = 960;

// Minimal projection: a complete-binary-tree layout computed purely from array
// indices (parent/child positions are arithmetic). NOT a general TreeView (D-20).
export default function HeapStripView({ state, col = 'main', simplified = false, height = 260 }: Props) {
  const items = orderedIndices(state, col);
  const n = items.length;
  if (n === 0) return <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} />;

  const levels = Math.floor(Math.log2(n)) + 1;
  const topPad = 34;
  const levelGap = (height - topPad - 24) / Math.max(1, levels - 1 || 1);
  const r = Math.min(22, (W / Math.pow(2, levels - 1)) * 0.32);

  const pos = (i: number) => {
    const L = Math.floor(Math.log2(i + 1));
    const indexInLevel = i - (Math.pow(2, L) - 1);
    const countInLevel = Math.pow(2, L);
    const x = ((indexInLevel + 0.5) / countInLevel) * W;
    const y = topPad + L * (levels > 1 ? levelGap : 0);
    return { x, y };
  };

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" aria-label="heap tree">
      {items.map((_, i) => {
        const p = pos(i);
        return [2 * i + 1, 2 * i + 2].map((ci) =>
          ci < n ? (
            <line
              key={`e-${i}-${ci}`}
              x1={p.x}
              y1={p.y}
              x2={pos(ci).x}
              y2={pos(ci).y}
              stroke="var(--glass-border)"
              strokeWidth={1.5}
            />
          ) : null,
        );
      })}
      {items.map((it, i) => {
        const p = pos(i);
        const vis = entityVisual(state, it.id);
        return (
          <g
            key={it.id}
            style={{ transition: 'transform var(--dur-move) var(--ease)' }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={vis.fill}
              opacity={vis.dim ? 0.5 : 1}
              stroke={vis.outline ?? 'transparent'}
              strokeWidth={vis.outline ? 2.5 : 0}
              style={{
                filter: vis.glow && !simplified ? `drop-shadow(0 0 7px ${vis.fill})` : undefined,
                transition: 'fill var(--dur-light)',
              }}
            />
            <text
              x={p.x}
              y={p.y + 5}
              textAnchor="middle"
              className="mono"
              fontSize={13}
              fontWeight={700}
              fill="#06070d"
            >
              {String(state.entities[it.id]?.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
