---
name: prompt-preflight
description: Pre-flight check for a Claude prompt before it ships. Estimates input tokens, where the prompt sits in the model's context window, cost per call and per 1,000 calls, and where prompt-caching boundaries fall. Use when the user asks how many tokens or how much a prompt, system prompt or agent call will cost, whether it fits the context window, or how to make it cheaper.
---

# Prompt Preflight

Answer before the prompt is deployed: **how many tokens, how much context window, how much money, and where does caching help?**

## Inputs to collect
- System prompt and a representative user message (or tool definitions, if any).
- Target model (default: ask; if unknown assume Sonnet 5.5).
- Expected output tokens per call (default 500 and say it is an assumption).
- Calls per day, if the user wants a monthly estimate.

## Step 1: count input tokens
Prefer an exact count when the user already has an `ANTHROPIC_API_KEY` in their environment and agrees to send the prompt to Anthropic (the endpoint is free):

```bash
curl -s https://api.anthropic.com/v1/messages/count_tokens \
  -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-5-5","system":"<system>","messages":[{"role":"user","content":"<message>"}]}'
```

Never ask the user to paste a key into chat. Otherwise use the heuristic and label it an **estimate**:

- `tokens ≈ characters / 3.7` for English prose (older tokenizer).
- Models on the newer tokenizer (5.x family, Opus 4.7/4.8) count the same text about **30% higher**: multiply by 1.3.
- Turkish, other non-English text, code and CJK usually produce more tokens per character: treat the estimate as a lower bound.

## Step 2: context-window position
`position = input_tokens / context_window`. Windows and prices are in `references/models.md`. Flag: under 50% fine, 50-80% watch it, over 80% risky once output and history are added.

## Step 3: cost
For input tokens `I` and output tokens `O` at the model's per-million rates:

```
per_call = I/1e6 * input_rate + O/1e6 * output_rate
per_1k   = per_call * 1000
```

- Cached input (cache read) costs `cache_read_rate` instead of `input_rate`. Show both cold and steady-state cached cost.
- The first call that writes the cache costs 1.25x the input rate (5-minute TTL).
- Haiku 5.5 has two rate cards: a higher one above 100K prompt tokens.

## Step 4: caching boundaries
Cache hits need an identical prefix. Check the order: stable content first (system prompt, tool definitions, long reference docs), volatile content last (user message, timestamps, IDs). If volatile text sits early, everything after it misses the cache. Recommend moving it.

## Step 5: report
A short table: input tokens (exact/estimate), % of window, cost per call (cold and cached), cost per 1K calls, plus the top 1-3 concrete trimming or reordering suggestions (duplicate instructions, oversized examples, verbose tool descriptions).

## Do not
- Do not present heuristic counts as exact.
- Do not quote prices from memory. Use `references/models.md` and tell the user the table has a date; for anything newer point them to Anthropic's pricing page.
- Do not send the user's prompt anywhere without their agreement.

A browser version of this analysis (no install) is at https://context-lens-sigma.vercel.app and its source is github.com/ferhatatagun/context-lens.
