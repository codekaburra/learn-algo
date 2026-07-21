import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_ORDER, modules } from '../algos/registry';
import { CATEGORY_META, accentVars } from '../lib/category';
import { useAllProgress } from '../lib/progress';
import type { AlgoModule, Category, Difficulty } from '../algos/types';

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];

export default function CatalogPage() {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [diff, setDiff] = useState<Difficulty | 'all'>('all');
  const [byDifficulty, setByDifficulty] = useState(false);
  const progress = useAllProgress();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (cat !== 'all' && m.meta.category !== cat) return false;
      if (diff !== 'all' && m.meta.difficulty !== diff) return false;
      if (q && !m.meta.title.toLowerCase().includes(q) && !m.meta.category.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [query, cat, diff]);

  const groups = useMemo(() => {
    if (byDifficulty) {
      return DIFFS.map((d) => ({
        title: d[0].toUpperCase() + d.slice(1),
        items: filtered.filter((m) => m.meta.difficulty === d),
      })).filter((g) => g.items.length > 0);
    }
    return CATEGORY_ORDER.map((c) => ({
      title: c,
      items: filtered.filter((m) => m.meta.category === c),
    })).filter((g) => g.items.length > 0);
  }, [filtered, byDifficulty]);

  const done = Object.values(progress).filter((p) => p === 'understood').length;

  return (
    <div className="container page">
      <header className="catalog-head">
        <div>
          <h1 className="page-title">Academy</h1>
          <p className="page-sub">
            Watch {modules.length} algorithms move. {done} marked understood.
          </p>
        </div>
      </header>

      <div className="filters glass">
        <input
          className="search"
          placeholder="Search algorithms…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="search algorithms"
        />
        <select value={cat} onChange={(e) => setCat(e.target.value as Category | 'all')} aria-label="category">
          <option value="all">All categories</option>
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={diff} onChange={(e) => setDiff(e.target.value as Difficulty | 'all')} aria-label="difficulty">
          <option value="all">All difficulty</option>
          {DIFFS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button
          className={`btn${byDifficulty ? ' primary' : ''}`}
          onClick={() => setByDifficulty((v) => !v)}
        >
          Sort by difficulty
        </button>
      </div>

      {groups.length === 0 && <p className="state-empty">No algorithms match.</p>}

      {groups.map((g) => (
        <section key={g.title} className="cat-section">
          <h2 className="cat-heading">
            <span
              className="cat-chip"
              style={
                CATEGORY_META[g.title as Category]
                  ? { background: CATEGORY_META[g.title as Category].accent }
                  : { background: 'var(--text-lo)' }
              }
            />
            {g.title}
            <span className="cat-count label">{g.items.length}</span>
          </h2>
          <div className="card-grid">
            {g.items.map((m) => (
              <AlgoCard key={m.meta.slug} mod={m} state={progress[m.meta.slug]} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function AlgoCard({ mod, state }: { mod: AlgoModule; state?: string }) {
  const { meta } = mod;
  return (
    <Link
      to={`/academy/${meta.slug}`}
      className="algo-card glass"
      style={accentVars(meta.category)}
    >
      <div className="card-top">
        <span className={`diff-dot diff-${meta.difficulty}`} aria-label={meta.difficulty} />
        {state === 'understood' && <span className="card-check" title="understood">✓</span>}
        {state === 'viewed' && <span className="card-check viewed" title="viewed">•</span>}
      </div>
      <h3 className="card-title">{meta.title}</h3>
      <div className="card-meta">
        <span className="mono card-complexity">{meta.complexity.time}</span>
      </div>
      <p className="card-lights">{meta.lights}</p>
    </Link>
  );
}
