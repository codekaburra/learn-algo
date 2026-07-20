import { Link } from 'react-router-dom';
import { modules } from '../algos/registry';

export default function HomePage() {
  return (
    <div className="container page home">
      <section className="hero">
        <h1 className="hero-title">
          See the data <span className="grad">move</span>.
        </h1>
        <p className="hero-sub">
          AlgoLab animates algorithms step by step — elements light up as they are
          compared, glide as they swap, pointers slide across the array. Control it like a
          video: play, pause, step, scrub, change speed.
        </p>
        <div className="hero-cta">
          <Link to="/academy" className="btn primary hero-btn">Open Academy →</Link>
          <Link to="/exercise" className="btn hero-btn">Exercise (soon)</Link>
        </div>
        <p className="hero-count label">{modules.length} algorithms live · dark mode · no sign-in</p>
      </section>
    </div>
  );
}
