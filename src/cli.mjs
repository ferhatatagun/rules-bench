import { basename, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { scanPack, summarize, estimateTokens, CHARS_PER_TOKEN } from './scan.mjs';
import { countExact } from './exact.mjs';

const HELP = `rules-bench — what do your Claude Code rule/skill packs cost in context?

Usage: rules-bench <pack-dir> [<pack-dir>...] [options]

  --window <n>     context window in tokens (default 200000)
  --skip-root      ignore the pack's own CLAUDE.md / AGENTS.md
  --rules <a,b>    only count these rules/<subdir>s (e.g. common,typescript)
  --exact          exact startup count via count_tokens (needs ANTHROPIC_API_KEY)
  --model <id>     model for --exact (default claude-sonnet-5-5)
  --json           machine-readable output
  -h, --help       this text

Startup  = loaded every session (CLAUDE.md, rules, skill/agent name+description).
On-demand = loaded when a skill/agent/command triggers (bodies, plus skill refs).
Estimates use ~${CHARS_PER_TOKEN} chars/token unless --exact is set.`;

/** @param {string[]} argv */
function parseArgs(argv) {
  const o = { dirs: /** @type {string[]} */ ([]), window: 200_000, skipRoot: false, rulesOnly: /** @type {string[]|undefined} */ (undefined), exact: false, json: false, model: 'claude-sonnet-5-5' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') return { ...o, help: true };
    else if (a === '--window') o.window = Number(argv[++i]);
    else if (a === '--model') o.model = argv[++i];
    else if (a === '--rules') o.rulesOnly = argv[++i].split(',');
    else if (a === '--skip-root') o.skipRoot = true;
    else if (a === '--exact') o.exact = true;
    else if (a === '--json') o.json = true;
    else if (a.startsWith('-')) throw new Error(`unknown option ${a}`);
    else o.dirs.push(a);
  }
  return o;
}

const fmt = (n) => n.toLocaleString('en-US');
const pct = (n, w) => `${((n / w) * 100).toFixed(1)}%`;

export async function main(argv) {
  const o = parseArgs(argv);
  if (o.help || o.dirs.length === 0) {
    console.log(HELP);
    return o.help ? 0 : 1;
  }
  if (!Number.isFinite(o.window) || o.window <= 0) throw new Error('--window must be a positive number');
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (o.exact && !apiKey) throw new Error('--exact needs ANTHROPIC_API_KEY');

  const results = [];
  for (const d of o.dirs) {
    const root = resolve(d);
    if (!existsSync(root)) throw new Error(`not found: ${d}`);
    const items = scanPack(root, { skipRoot: o.skipRoot, rulesOnly: o.rulesOnly });
    const rows = summarize(items);
    const startup = rows.reduce((s, r) => s + r.startup, 0);
    const onDemand = rows.reduce((s, r) => s + r.onDemand, 0);
    const refs = rows.reduce((s, r) => s + r.refs, 0);
    const skills = rows.find((r) => r.kind === 'skills');
    const result = {
      pack: basename(root),
      method: 'estimate',
      startupTokens: startup,
      startupPctOfWindow: Number(((startup / o.window) * 100).toFixed(2)),
      onDemandTokens: onDemand,
      refTokens: refs,
      avgSkillBodyTokens: skills && skills.count ? Math.round(skills.onDemand / skills.count) : 0,
      rows,
    };
    if (o.exact) {
      const text = items.map((i) => i.startup).join('\n');
      result.startupTokensExact = await countExact(text, { apiKey: /** @type {string} */ (apiKey), model: o.model });
      result.method = `exact startup (${o.model}), estimated on-demand`;
    }
    results.push(result);
  }

  if (o.json) {
    console.log(JSON.stringify(results, null, 2));
    return 0;
  }
  for (const r of results) {
    console.log(`\n${r.pack}  [${r.method}]`);
    console.log('kind        items   startup   on-demand      refs');
    for (const row of r.rows) {
      console.log(`${row.kind.padEnd(10)} ${String(row.count).padStart(6)} ${fmt(row.startup).padStart(9)} ${fmt(row.onDemand).padStart(11)} ${fmt(row.refs).padStart(9)}`);
    }
    const shown = r.startupTokensExact ?? r.startupTokens;
    console.log(`startup total: ${fmt(shown)} tokens = ${pct(shown, o.window)} of ${fmt(o.window)} window${r.startupTokensExact ? ' (exact)' : ''}`);
    if (r.avgSkillBodyTokens) console.log(`avg skill body when triggered: ~${fmt(r.avgSkillBodyTokens)} tokens`);
  }
  if (results.length > 1) {
    console.log('\nranked by startup cost:');
    for (const r of [...results].sort((a, b) => a.startupTokens - b.startupTokens)) {
      console.log(`  ${r.pack.padEnd(28)} ${fmt(r.startupTokens).padStart(8)} tokens (${r.startupPctOfWindow}%)`);
    }
  }
  return 0;
}

export { estimateTokens };
