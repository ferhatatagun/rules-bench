# Agensi listing copy: prompt-preflight

**Title:** Prompt Preflight — tokens, window and cost before you ship
**Price:** Free
**Category:** LLM Ops (alt: Prompt & Skill Engineering)
**Summary (<=300 chars):** Check a Claude prompt before it ships: estimated or exact input tokens, position in the context window, cost per call and per 1,000 calls, and where prompt caching would (and would not) hit. Includes a dated model/price table.
**Tags (<=10):** claude, prompt, tokens, cost, pricing, context-window, prompt-caching, llm-ops, optimization, count-tokens
**Keywords:** token counter, prompt cost, claude pricing, cache read, context window
**Use cases:**
1. Estimate what a system prompt costs per 1,000 calls
2. Check a prompt fits the context window with room for output
3. Reorder a prompt so the stable prefix gets cached
4. Compare cost across Sonnet, Opus, Haiku and Fable

**Needs access to:** optional ANTHROPIC_API_KEY in the environment for exact counts (free count_tokens endpoint)
**Link back:** https://github.com/ferhatatagun/context-lens (live demo: https://context-lens-sigma.vercel.app)
