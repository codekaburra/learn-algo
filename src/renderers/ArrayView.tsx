import { useMemo } from 'react';
import type { CollectionId, Location } from '../engine/protocol';
import { orderedIndices, type ViewState } from '../engine/reduce';
import { entityVisual } from './colors';

interface Props {
  state: ViewState;
  col?: CollectionId;
  mode?: 'bars' | 'boxes';
  simplified?: boolean;
  height?: number;
}

const W = 960;

function pointerIndex(loc: Location | null, col: CollectionId): number | null {
  if (loc && loc.kind === 'index' && loc.col === col) return loc.index;
  return null;
}

export default function ArrayView({
  state,
  col = 'main',
  mode = 'bars',
  simplified = false,
  height = 360,
}: Props) {
  const items = orderedIndices(state, col);
  const H = height;
  const count = Math.max(items.length, 1);
  const slot = W / count;
  const gap = Math.min(slot * 0.18, 12);
  const barW = slot - gap;

  const maxVal = useMemo(() => {
    const nums = items
      .map((it) => state.entities[it.id]?.value)
      .filter((v): v is number => typeof v === 'number');
    return Math.max(1, ...nums);
  }, [items, state.entities]);

  const topPad = 46;
  const bottomPad = 34;
  const drawH = H - topPad - bottomPad;

  // Pointers grouped by index.
  const pointersByIndex = new Map<number, string[]>();
  for (const [name, loc] of Object.entries(state.pointers)) {
    const i = pointerIndex(loc, col);
    if (i !== null) {
      if (!pointersByIndex.has(i)) pointersByIndex.set(i, []);
      pointersByIndex.get(i)!.push(name);
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      role="img"
      aria-label={`${col} visualization`}
      style={{ display: 'block' }}
    >
      {/* ranges (window highlights) */}
      {Object.entries(state.ranges).map(([name, r]) => {
        if (r.col !== col) return null;
        const x = r.from * slot;
        const w = (r.to - r.from + 1) * slot;
        return (
          <rect
            key={`range-${name}`}
            x={x}
            y={topPad - 8}
            width={Math.max(0, w)}
            height={drawH + 16}
            rx={10}
            fill="color-mix(in srgb, var(--accent) 10%, transparent)"
            stroke="color-mix(in srgb, var(--accent) 40%, transparent)"
            strokeDasharray="4 4"
          />
        );
      })}

      {items.map((it) => {
        const v = state.entities[it.id]?.value;
        const num = typeof v === 'number' ? v : 0;
        const vis = entityVisual(state, it.id);
        const x = it.index * slot;

        const barH = mode === 'bars' ? Math.max(6, (num / maxVal) * drawH) : Math.min(barW, drawH * 0.5);
        const y = mode === 'bars' ? topPad + (drawH - barH) : topPad + drawH / 2 - barH / 2;
        const filter = vis.glow && !simplified ? `drop-shadow(0 0 8px ${vis.fill})` : undefined;

        return (
          <g
            key={it.id}
            style={{
              transform: `translateX(${x}px)`,
              transition: `transform var(--dur-move) var(--ease)`,
            }}
            className={vis.error ? 'shake' : undefined}
          >
            <rect
              x={gap / 2}
              y={y}
              width={barW}
              height={barH}
              rx={mode === 'boxes' ? 10 : 6}
              fill={vis.fill}
              opacity={vis.dim ? 0.5 : 1}
              stroke={vis.outline ?? 'transparent'}
              strokeWidth={vis.outline ? 2.5 : 0}
              style={{
                filter,
                transition: `fill var(--dur-light), height var(--dur-move) var(--ease), y var(--dur-move) var(--ease), opacity var(--dur-light)`,
              }}
            />
            <text
              x={slot / 2}
              y={mode === 'bars' ? H - bottomPad + 18 : topPad + drawH / 2 + 5}
              textAnchor="middle"
              className="mono"
              fontSize={Math.min(15, barW * 0.5)}
              fill={mode === 'boxes' ? '#06070d' : 'var(--text-lo)'}
              fontWeight={mode === 'boxes' ? 700 : 500}
            >
              {String(v)}
            </text>
          </g>
        );
      })}

      {/* pointers */}
      {[...pointersByIndex.entries()].map(([i, names]) => {
        const cx = i * slot + slot / 2;
        return (
          <g
            key={`ptr-${i}`}
            style={{
              transform: `translateX(${cx}px)`,
              transition: `transform 180ms var(--ease)`,
            }}
          >
            <path d="M -7 8 L 7 8 L 0 0 Z" fill="var(--el-pointer)" transform="translate(0 6)" />
            <text
              x={0}
              y={0}
              textAnchor="middle"
              className="mono"
              fontSize={12}
              fontWeight={700}
              fill="var(--el-pointer)"
            >
              {names.join(',')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
