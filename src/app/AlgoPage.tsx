import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bySlug } from '../algos/registry';
import { collectFrames } from '../engine/timeline';
import { usePlayer } from '../engine/player';
import Renderer from '../renderers';
import CodePanel from '../components/CodePanel';
import StatePanel from '../components/StatePanel';
import PlaybackBar from '../components/PlaybackBar';
import Explanation from '../components/Explanation';
import TableView from '../components/TableView';
import { accentVars, CATEGORY_META } from '../lib/category';
import { usePlaybackKeys } from '../lib/useKeyboard';
import { setProgress, useProgress } from '../lib/progress';
import type { AlgoModule } from '../algos/types';

export default function AlgoPage() {
  const { slug = '' } = useParams();
  const mod = bySlug[slug];
  if (!mod) {
    return (
      <div className="container page">
        <p>Unknown algorithm. <Link to="/academy">Back to catalog</Link>.</p>
      </div>
    );
  }
  return <AlgoPageInner key={slug} mod={mod} />;
}

function AlgoPageInner({ mod }: { mod: AlgoModule }) {
  usePlaybackKeys();
  const load = usePlayer((s) => s.load);
  const view = usePlayer((s) => s.view);
  const speed = usePlayer((s) => s.speed);
  const playing = usePlayer((s) => s.playing);
  const truncated = usePlayer((s) => s.truncated);
  const pause = usePlayer((s) => s.pause);

  const [input, setInput] = useState(() => mod.input.default());
  const [seed, setSeed] = useState(1);
  const [showTable, setShowTable] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const progress = useProgress(mod.meta.slug);

  const frames = useMemo(() => collectFrames(mod.run(input)).frames, [mod, input]);

  useEffect(() => {
    load(frames);
  }, [frames, load]);

  useEffect(() => () => pause(), [pause]);

  // Auto-mark viewed after opening.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!viewedRef.current) {
      viewedRef.current = true;
      if (progress === 'none') setProgress(mod.meta.slug, 'viewed');
    }
  }, [mod.meta.slug, progress]);

  const meta = mod.meta;
  const catMeta = CATEGORY_META[meta.category];
  const isIntArray = mod.input.schema.kind === 'int-array';

  function randomize() {
    const s = seed + 1;
    setSeed(s);
    setInput(mod.input.random(s));
    setEditing(false);
    setError(null);
  }

  function startEdit() {
    setDraft(Array.isArray(input) ? (input as number[]).join(', ') : '');
    setEditing(true);
    setError(null);
  }

  function applyEdit() {
    const nums = draft
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0)
      .map(Number);
    if (nums.some((n) => !Number.isFinite(n))) {
      setError('Enter comma-separated numbers.');
      return;
    }
    const max = mod.input.schema.maxVisualSize ?? 30;
    if (nums.length > max) {
      setError(`At most ${max} values.`);
      return;
    }
    setInput(nums);
    setEditing(false);
    setError(null);
  }

  return (
    <div className="algo-page" style={accentVars(meta.category)}>
      <a href="#controls" className="skip-link">Skip to controls</a>

      <div className="container">
        <header className="algo-head">
          <Link to="/academy" className="back-link">← Back</Link>
          <span className="chip" style={{ ['--accent' as string]: catMeta.accent }}>
            {meta.category}
          </span>
          <h1 className="algo-title">{meta.title}</h1>
          <span className="diff-dot" aria-hidden />
          <span className={`diff-dot diff-${meta.difficulty}`} aria-hidden />
          <span className="label">{meta.difficulty}</span>
          <span className="chip mono">{meta.complexity.time}</span>
          {meta.paradigm.map((p) => (
            <span className="paradigm-tag label" key={p}>{p}</span>
          ))}
          <div className="progress-toggle">
            <button
              className={`btn${progress === 'understood' ? ' primary' : ''}`}
              onClick={() =>
                setProgress(meta.slug, progress === 'understood' ? 'viewed' : 'understood')
              }
            >
              {progress === 'understood' ? '✓ Understood' : 'Mark understood'}
            </button>
          </div>
        </header>

        {truncated && (
          <div className="banner glass">Recording truncated at the frame limit.</div>
        )}

        <div className="algo-grid">
          <section className="viz-panel glass" aria-label="visualization">
            <div className="viz-controls-top">
              <button className="btn" onClick={randomize}>🎲 Randomize</button>
              {isIntArray && !editing && (
                <button className="btn" onClick={startEdit}>✎ Edit input</button>
              )}
              {isIntArray && editing && (
                <span className="edit-row">
                  <input
                    className="edit-input mono"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && applyEdit()}
                    aria-label="edit input values"
                  />
                  <button className="btn primary" onClick={applyEdit}>Apply</button>
                  <button className="btn" onClick={() => setEditing(false)}>Cancel</button>
                </span>
              )}
              {error && <span className="edit-error">{error}</span>}
              <span className="spacer" />
              <button
                className={`btn${showTable ? ' primary' : ''}`}
                onClick={() => setShowTable((v) => !v)}
                aria-pressed={showTable}
              >
                Table view
              </button>
            </div>
            <Renderer module={mod} state={view} simplified={speed >= 2} />
            <div className="note-caption" aria-hidden>{view.note ?? ''}</div>
            <div className="sr-only" aria-live="polite">
              {playing && speed < 2 ? view.note : ''}
            </div>
          </section>

          <aside className="side-panels">
            <CodePanel code={mod.code} activeLine={view.line} />
            <StatePanel state={view} />
          </aside>
        </div>

        <div id="controls">
          <PlaybackBar />
        </div>

        {showTable && <TableView state={view} />}

        <Explanation markdown={meta.explanation} />
      </div>
    </div>
  );
}
