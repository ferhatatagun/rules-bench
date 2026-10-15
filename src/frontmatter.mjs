/**
 * Minimal YAML frontmatter reader — only what skill/agent/command files use:
 * flat `key: value` pairs, quoted values, and `>` / `|` / indented continuations.
 * @param {string} text
 * @returns {{ data: Record<string, string>, raw: string, body: string }}
 */
export function parseFrontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!m) return { data: {}, raw: '', body: text };
  const raw = m[1];
  /** @type {Record<string, string>} */
  const data = {};
  let key = null;
  for (const line of raw.split(/\r?\n/)) {
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (kv && !/^\s/.test(line)) {
      key = kv[1];
      data[key] = unquote(kv[2].replace(/^[>|][-+]?$/, ''));
    } else if (key && /^\s+\S/.test(line)) {
      data[key] = `${data[key]} ${line.trim()}`.trim();
    }
  }
  return { data, raw, body: m[2] };
}

/** @param {string} v */
function unquote(v) {
  const t = v.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }
  return t;
}
