interface Props {
  markdown: string;
}

// Tiny markdown renderer: **bold**, `code`, and paragraph breaks. Enough for the
// what/when/pitfalls explanation blocks.
function renderInline(text: string, keyBase: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**'))
      return <strong key={`${keyBase}-${i}`}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`'))
      return (
        <code className="mono inline-code" key={`${keyBase}-${i}`}>
          {p.slice(1, -1)}
        </code>
      );
    return <span key={`${keyBase}-${i}`}>{p}</span>;
  });
}

export default function Explanation({ markdown }: Props) {
  const blocks = markdown.trim().split(/\n\n+/);
  return (
    <div className="explanation glass">
      <h2 className="explain-title">How it works</h2>
      {blocks.map((b, i) => (
        <p key={i} className="explain-p">
          {renderInline(b, `b${i}`)}
        </p>
      ))}
    </div>
  );
}
