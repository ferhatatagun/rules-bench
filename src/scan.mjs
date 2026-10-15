import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';

/** Same heuristic context-lens uses when no API key is available. */
export const CHARS_PER_TOKEN = 3.7;

/** @param {string} text */
export const estimateTokens = (text) => Math.ceil(text.length / CHARS_PER_TOKEN);

/**
 * @typedef {'memory'|'rules'|'skills'|'agents'|'commands'} Kind
 * @typedef {{ kind: Kind, file: string, startup: string, onDemand: string, refs: string }} Item
 *   startup  = text Claude Code loads every session (counts against context before the first prompt)
 *   onDemand = text loaded only when the item triggers (skill body, agent prompt, command body)
 *   refs     = extra files shipped next to a skill, read only if the skill asks for them
 */

/** @param {string} dir @param {(f: string) => boolean} pred @returns {string[]} */
function walk(dir, pred) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p, pred));
    else if (pred(p)) out.push(p);
  }
  return out;
}

const read = (p) => readFileSync(p, 'utf8');
const isMd = (p) => p.endsWith('.md');

/** @param {Record<string,string>} d */
const nameDesc = (d) => `${d.name ?? ''}: ${d.description ?? ''}`;

/**
 * Scan one pack root for the conventional Claude Code locations
 * (root and `.claude/`): CLAUDE.md, AGENTS.md, rules/, skills/, agents/, commands/.
 * @param {string} root
 * @param {{ skipRoot?: boolean, rulesOnly?: string[] }} [opts]  rulesOnly = only these rules/<subdir>s (e.g. common, typescript)
 * @returns {Item[]}
 */
export function scanPack(root, opts = {}) {
  /** @type {Item[]} */
  const items = [];
  const bases = [root, join(root, '.claude')];

  for (const base of bases) {
    if (!opts.skipRoot) {
      for (const f of ['CLAUDE.md', 'AGENTS.md']) {
        const p = join(base, f);
        if (existsSync(p)) {
          items.push({ kind: 'memory', file: relative(root, p), startup: read(p), onDemand: '', refs: '' });
        }
      }
    }

    const inRules = (f) => {
      if (!opts.rulesOnly) return true;
      const sub = relative(join(base, 'rules'), f).split('/')[0];
      return opts.rulesOnly.includes(sub);
    };
    for (const p of walk(join(base, 'rules'), (f) => isMd(f) && !/README\.md$/.test(f) && inRules(f))) {
      items.push({ kind: 'rules', file: relative(root, p), startup: read(p), onDemand: '', refs: '' });
    }

    for (const p of walk(join(base, 'skills'), (f) => f.endsWith('SKILL.md'))) {
      const { data, body } = parseFrontmatter(read(p));
      const dir = dirname(p);
      const refs = walk(dir, (f) => f !== p && /\.(md|txt|sh|py|json|ya?ml)$/.test(f))
        .map(read)
        .join('\n');
      items.push({ kind: 'skills', file: relative(root, p), startup: nameDesc(data), onDemand: body, refs });
    }

    for (const kind of /** @type {const} */ (['agents', 'commands'])) {
      for (const p of walk(join(base, kind), (f) => isMd(f) && !/README\.md$/.test(f))) {
        const { data, body } = parseFrontmatter(read(p));
        const startup = kind === 'agents' ? nameDesc({ name: data.name ?? p, description: data.description }) : (data.description ?? '');
        items.push({ kind, file: relative(root, p), startup, onDemand: body, refs: '' });
      }
    }
  }
  return items;
}

/**
 * @param {Item[]} items
 * @returns {{ kind: Kind, count: number, startup: number, onDemand: number, refs: number }[]}
 */
export function summarize(items) {
  /** @type {Map<Kind, { kind: Kind, count: number, startup: number, onDemand: number, refs: number }>} */
  const by = new Map();
  for (const it of items) {
    const row = by.get(it.kind) ?? { kind: it.kind, count: 0, startup: 0, onDemand: 0, refs: 0 };
    row.count += 1;
    row.startup += estimateTokens(it.startup);
    row.onDemand += it.onDemand ? estimateTokens(it.onDemand) : 0;
    row.refs += it.refs ? estimateTokens(it.refs) : 0;
    by.set(it.kind, row);
  }
  const order = ['memory', 'rules', 'skills', 'agents', 'commands'];
  return [...by.values()].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
}
