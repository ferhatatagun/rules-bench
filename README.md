# rules-bench

**What does a Claude Code rule / skill / agent pack cost in context before you type a word?**

Zero dependencies, no backend. Point it at a pack's folder and it splits the cost into:

- **Startup** — loaded every session: `CLAUDE.md`, `rules/`, and the `name + description` of every skill, agent and command.
- **On-demand** — loaded only when a skill / agent / command triggers (bodies, plus files shipped next to a skill).

```bash
node bin/rules-bench.mjs path/to/pack [path/to/other-pack ...]
```

| Option | |
|---|---|
| `--window <n>` | context window in tokens (default 200000) |
| `--skip-root` | ignore the pack's own `CLAUDE.md` / `AGENTS.md` (use for repos where those describe the repo, not the pack) |
| `--rules common,typescript` | only count these `rules/<subdir>`s — mirrors "install common + your language" |
| `--exact` | exact **startup** count via the free `count_tokens` endpoint (`ANTHROPIC_API_KEY`) |
| `--json` | machine-readable output |

Without `--exact`, counts use the same ~3.7 chars/token heuristic as [context-lens](https://github.com/ferhatatagun/context-lens), so they are **estimates**.
The heuristic is calibrated to the older tokenizer; current models (Sonnet/Opus/Haiku 5.x) count the same text as roughly 30% more tokens, so treat estimates as a lower bound and use `--exact` (default model `claude-sonnet-5-5`) for the real startup number.
With `--exact`, on-demand numbers stay estimates (a 700k-token pack can't be sent in one request).

## First results (estimates, 200K window, 2026-10)

| Pack | Startup | % of window | On-demand (all triggered) |
|---|---|---|---|
| [karpathy CLAUDE.md + skill](https://github.com/multica-ai/andrej-karpathy-skills) | ~700 | 0.3% | ~600 |
| [mattpocock/skills](https://github.com/mattpocock/skills) (38 skills) | ~1,600 | 0.8% | ~43k (+24k refs); ~1.1k per skill |
| [ECC](https://github.com/affaan-m/ECC) — `rules/common` + `typescript` | ~43k | 21% | ~985k; ~2.4k per skill |
| ECC — everything | ~113k | 57% | ~985k |

Takeaways: a four-rule CLAUDE.md is ~60× cheaper than a typical ECC setup, and installing all of ECC's rules at once spends over half the window before the first prompt.

## Dev

```bash
npm test
```

MIT
