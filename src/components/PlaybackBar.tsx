import { usePlayer, SPEEDS, type Speed } from '../engine/player';

export default function PlaybackBar() {
  const { cursor, playing, speed, timeline, toggle, next, prev, seek, restart, setSpeed } =
    usePlayer();
  const total = timeline?.length ?? 0;

  return (
    <div className="playback glass" role="group" aria-label="playback controls">
      <button className="btn icon" onClick={restart} aria-label="restart" disabled={!total}>
        ⏮
      </button>
      <button className="btn icon" onClick={prev} aria-label="step back" disabled={cursor < 0}>
        ◀
      </button>
      <button
        className="btn icon primary play-btn"
        onClick={toggle}
        aria-label={playing ? 'pause' : 'play'}
        disabled={!total}
        data-attn={!playing && cursor < 0 ? 'true' : undefined}
      >
        {playing ? '⏸' : '▶'}
      </button>
      <button
        className="btn icon"
        onClick={next}
        aria-label="step forward"
        disabled={cursor >= total - 1}
      >
        ▶▶
      </button>

      <div className="speed-group">
        <span className="label">Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            className={`speed-btn${s === speed ? ' active' : ''}`}
            onClick={() => setSpeed(s as Speed)}
            aria-pressed={s === speed}
          >
            {s}×
          </button>
        ))}
      </div>

      <input
        className="scrubber"
        type="range"
        min={-1}
        max={Math.max(0, total - 1)}
        value={cursor}
        onChange={(e) => seek(Number(e.target.value))}
        aria-label={`frame ${cursor + 1} of ${total}`}
      />
      <span className="frame-count mono label">
        {cursor + 1}/{total}
      </span>
    </div>
  );
}
