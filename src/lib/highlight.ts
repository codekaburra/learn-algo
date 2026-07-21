// Minimal JS tokenizer for Academy code display (D-21). Not a full parser — good
// enough to color keywords, strings, numbers, comments, and calls.

export interface Tok {
  text: string;
  cls: string;
}

const KEYWORDS = new Set([
  'function', 'return', 'const', 'let', 'var', 'if', 'else', 'for', 'while',
  'do', 'break', 'continue', 'new', 'of', 'in', 'true', 'false', 'null',
  'undefined', 'this', 'Infinity', 'class', 'extends', 'super', 'switch',
  'case', 'default', 'typeof',
]);

export function tokenizeLine(line: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = line.length;

  const push = (text: string, cls: string) => text && toks.push({ text, cls });

  while (i < n) {
    const c = line[i];

    // comment to end of line
    if (c === '/' && line[i + 1] === '/') {
      push(line.slice(i), 'tok-comment');
      break;
    }
    // strings
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      while (j < n && line[j] !== c) {
        if (line[j] === '\\') j++;
        j++;
      }
      push(line.slice(i, j + 1), 'tok-string');
      i = j + 1;
      continue;
    }
    // numbers
    if (/[0-9]/.test(c)) {
      let j = i;
      while (j < n && /[0-9.]/.test(line[j])) j++;
      push(line.slice(i, j), 'tok-number');
      i = j;
      continue;
    }
    // identifiers / keywords
    if (/[A-Za-z_$]/.test(c)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      let k = j;
      while (k < n && line[k] === ' ') k++;
      if (KEYWORDS.has(word)) push(word, 'tok-keyword');
      else if (line[k] === '(') push(word, 'tok-fn');
      else push(word, 'tok-ident');
      i = j;
      continue;
    }
    // operators / punctuation
    if (/[+\-*/%<>=!&|?:.]/.test(c)) {
      let j = i;
      while (j < n && /[+\-*/%<>=!&|?:.]/.test(line[j])) j++;
      push(line.slice(i, j), 'tok-op');
      i = j;
      continue;
    }
    push(c, 'tok-punct');
    i++;
  }
  return toks;
}
