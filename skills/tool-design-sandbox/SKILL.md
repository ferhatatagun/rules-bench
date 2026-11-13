---
name: tool-design-sandbox
description: Helps design Claude tools before implementing them, by playing the agent loop by hand with mocked tool results. Reviews tool schemas, simulates tool_use and tool_result turns including errors and bad payloads, and reports what to change. Use when the user is defining tools or an agent for Claude, asks whether their tool schemas are good, or wants to stress-test how an agent recovers from tool failures.
---

# Tool Design Sandbox

Tool implementations are not the hard part of agent development; tool design is. Iterate on the design with fake tools first.

## The loop (reference)
1. Send `messages` + `tools` (`{ name, description, input_schema }`).
2. If `stop_reason` is `tool_use`, the assistant content contains `tool_use` blocks with `id`, `name`, `input`.
3. Reply with a user message of `tool_result` blocks: `tool_use_id` copied from each call, `content`, and `is_error: true` for failures. Return every result of a turn together.
4. Repeat until `stop_reason` is `end_turn`.

## Step 1: review the schemas
For each tool check:
- **Name**: verb-noun, unambiguous, no overlap with another tool.
- **Description**: says what it does, when to use it and when not to; this is the real prompt.
- **Parameters**: as few as possible, typed, enums where the set is closed, required vs optional correct, units stated.
- **Output shape**: what the result will contain, so the agent knows how to read it.
Flag tools that could be merged, split or removed.

## Step 2: simulate
Run the loop with the user's system prompt and a sample task. You play every tool: write realistic results yourself, label them as mocked. Cover at least:
- the happy path,
- a tool **error** (`is_error: true`, e.g. timeout),
- an empty result,
- a very large or garbage payload,
- an ambiguous request that could call two tools.
Note which calls the agent makes, what arguments it picks, and how it recovers.

## Step 3: report
Per tool: keep / rename / reword / split / drop, with the evidence from the simulation ("agent called `search` with a full sentence because the description did not say keywords"). Then list prompt changes only for what tool changes cannot fix.

## Do not
Do not call real tools or external services here; everything is mocked. Do not treat a simulated run as proof of production behaviour; recommend a real test once the design settles.

Interactive version where you type every tool result (bring your own key, no backend): https://tool-lab-bice.vercel.app, source github.com/ferhatatagun/tool-lab.
