import { useEffect, useMemo, useRef } from 'react';
import { tokenizeLine } from '../lib/highlight';

interface Props {
  code: string;
  activeLine?: number;
}

export default function CodePanel({ code, activeLine }: Props) {
  const lines = useMemo(() => code.split('\n'), [code]);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [activeLine]);

  return (
    <div className="code-panel glass" aria-label="reference implementation">
      <div className="code-head label">Code</div>
      <pre className="code-body">
        {lines.map((line, idx) => {
          const lineNo = idx + 1;
          const active = lineNo === activeLine;
          return (
            <div
              key={lineNo}
              ref={active ? activeRef : undefined}
              className={`code-line${active ? ' active' : ''}`}
            >
              <span className="code-gutter mono">{lineNo}</span>
              <span className="code-text mono">
                {tokenizeLine(line).map((t, i) => (
                  <span key={i} className={t.cls}>
                    {t.text}
                  </span>
                ))}
                {line === '' && ' '}
              </span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
