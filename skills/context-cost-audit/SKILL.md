---
name: context-cost-audit
description: Measures how many tokens a Claude Code rule, skill or agent pack costs in context before the first prompt (startup) versus only when triggered (on-demand). Use when the user asks what a CLAUDE.md, rules folder, skill pack or agent pack costs, why their context fills up, or which pack to install.
---

# Context Cost Audit

Answer one question with numbers: **what does this pack cost in context before I type a word?**

## Definitions

- **Startup**: loaded every session. `CLAUDE.md` / `AGENTS.md`, everything under `rules/`, and the `name` + `description` of every skill, agent and command.
- **On-demand**: loaded only when a skill, agent or command triggers (its body, plus files shipped next to a skill).

Startup is the number that matters. It is paid on every session whether or not the pack is used.

## Steps

1. **Locate the pack folder** (a cloned repo or `~/.claude`). Ask the user if unclear.
2. **Run it** (zero dependencies, Node 20+, nothing to install):
   ```bash
   npx rules-bench path/to/pack [path/to/other-pack ...]
   ```
   If npm is unavailable: `git clone https://github.com/ferhatatagun/rules-bench` and run `node bin/rules-bench.mjs <pack>`.
   Useful flags:
   - `--skip-root` when the pack's own `CLAUDE.md` describes the repo, not the pack.
   - `--rules common,typescript` to count only the `rules/<subdir>`s the user will actually install.
   - `--window <n>` for a non-default window (default 200000).
   - `--exact` for an exact startup count (needs `ANTHROPIC_API_KEY`).
   - `--json` for machine-readable output.
3. **Report** a table: pack, startup tokens, % of window, on-demand total, average cost per triggered skill.

## Reading the result

- Without `--exact`, counts are heuristic **estimates** calibrated to an older tokenizer. Current models count the same text roughly 30% higher, so treat estimates as a **lower bound**. Say so.
- Startup under ~2% of the window is lean. Above ~10% deserves a trim. Above ~50% leaves little room for the actual task.
- Compare packs on startup first, on-demand second.

## Recommendations to give

1. Move rarely needed rules into skills (loaded on demand, not every session).
2. Install only the language/domain rule subfolders the project uses.
3. Shorten skill `description` fields to the trigger condition. They are startup cost for every installed skill.
4. Drop duplicated guidance between `CLAUDE.md` and rules.

## Do not

- Do not present estimates as exact numbers.
- Do not modify the user's packs. This skill only measures and recommends.
