import { NavLink } from 'react-router-dom';

export default function Nav() {
  return (
    <nav className="nav">
      <NavLink to="/" className="logo" aria-label="AlgoLab home">
        <span className="logo-mark" aria-hidden />
        AlgoLab
      </NavLink>
      <div className="links">
        <NavLink to="/academy" className={({ isActive }) => (isActive ? 'active' : '')}>
          Academy
        </NavLink>
        <NavLink to="/exercise" className={({ isActive }) => (isActive ? 'active' : '')}>
          Exercise<span className="badge">soon</span>
        </NavLink>
      </div>
      <div className="spacer" />
      <a
        href="https://github.com/codekaburra/learn-algo"
        target="_blank"
        rel="noreferrer"
        className="btn icon"
        aria-label="GitHub"
      >
        ★
      </a>
    </nav>
  );
}
