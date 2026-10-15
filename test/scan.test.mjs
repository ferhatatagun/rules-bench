import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseFrontmatter } from '../src/frontmatter.mjs';
import { scanPack, summarize, estimateTokens } from '../src/scan.mjs';

test('frontmatter: plain, quoted and folded values', () => {
  const { data, body } = parseFrontmatter('---\nname: a\ndescription: >\n  one\n  two\nx: "q"\n---\nBODY');
  assert.equal(data.name, 'a');
  assert.equal(data.description, 'one two');
  assert.equal(data.x, 'q');
  assert.equal(body, 'BODY');
});

test('frontmatter: no frontmatter returns whole text as body', () => {
  assert.equal(parseFrontmatter('hello').body, 'hello');
});

test('scanPack splits startup vs on-demand', () => {
  const root = mkdtempSync(join(tmpdir(), 'rb-'));
  writeFileSync(join(root, 'CLAUDE.md'), 'x'.repeat(370));
  mkdirSync(join(root, 'rules'));
  writeFileSync(join(root, 'rules', 'a.md'), 'y'.repeat(37));
  mkdirSync(join(root, 'skills', 'cat', 's1'), { recursive: true });
  writeFileSync(join(root, 'skills', 'cat', 's1', 'SKILL.md'), '---\nname: s1\ndescription: does things\n---\n' + 'b'.repeat(370));
  writeFileSync(join(root, 'skills', 'cat', 's1', 'REF.md'), 'r'.repeat(37));
  mkdirSync(join(root, 'agents'));
  writeFileSync(join(root, 'agents', 'ag.md'), '---\nname: ag\ndescription: agent\n---\n' + 'p'.repeat(37));

  const rows = Object.fromEntries(summarize(scanPack(root)).map((r) => [r.kind, r]));
  assert.equal(rows.memory.startup, 100);
  assert.equal(rows.rules.startup, 10);
  assert.equal(rows.skills.count, 1);
  assert.equal(rows.skills.startup, estimateTokens('s1: does things'));
  assert.equal(rows.skills.onDemand, 100);
  assert.equal(rows.skills.refs, 10);
  assert.equal(rows.agents.onDemand, 10);
});

test('skipRoot drops CLAUDE.md', () => {
  const root = mkdtempSync(join(tmpdir(), 'rb-'));
  writeFileSync(join(root, 'CLAUDE.md'), 'x'.repeat(370));
  assert.equal(scanPack(root, { skipRoot: true }).length, 0);
});

test('rulesOnly filters rules subdirs', () => {
  const root = mkdtempSync(join(tmpdir(), 'rb-'));
  for (const d of ['common', 'python']) {
    mkdirSync(join(root, 'rules', d), { recursive: true });
    writeFileSync(join(root, 'rules', d, 'r.md'), 'z'.repeat(37));
  }
  const items = scanPack(root, { rulesOnly: ['common'] });
  assert.equal(items.length, 1);
  assert.match(items[0].file, /common/);
});
