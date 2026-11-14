import html, json
CSS = """
*{box-sizing:border-box}body{margin:0;width:1280px;height:720px;background:linear-gradient(135deg,#1e1b4b,#3b1d7a 55%,#6d1f5c);font-family:-apple-system,'Segoe UI',Roboto,'DejaVu Sans',sans-serif;color:#f5f3ff;display:flex;align-items:center;justify-content:center}
.win{width:1136px;min-height:420px;background:#14121f;border-radius:18px;box-shadow:0 30px 80px #0008;overflow:hidden;display:flex;flex-direction:column;border:1px solid #ffffff22}
.bar{height:46px;background:#1d1a2e;display:flex;align-items:center;padding:0 18px;gap:8px;border-bottom:1px solid #ffffff14}
.dot{width:12px;height:12px;border-radius:50%}.title{margin-left:14px;font-size:14px;color:#b4acd6;letter-spacing:.2px}
.body{padding:30px 36px 34px;display:flex;flex-direction:column;gap:16px}
.u{align-self:flex-end;background:#4c1d95;border-radius:16px 16px 4px 16px;padding:12px 18px;font-size:17px;max-width:760px}
.a{background:#1d1a2e;border-radius:16px 16px 16px 4px;padding:16px 20px;font-size:16px;line-height:1.5;border:1px solid #ffffff14}
.chip{display:inline-block;background:#2a2542;border-radius:8px;padding:3px 10px;font:13px 'DejaVu Sans Mono',monospace;color:#c4b5fd;margin-right:6px}
table{border-collapse:collapse;width:100%;font-size:15px;margin-top:8px}th{text-align:left;color:#a5a0c8;font-weight:600;padding:7px 12px;border-bottom:1px solid #ffffff22;font-size:13px;text-transform:uppercase;letter-spacing:.6px}
td{padding:8px 12px;border-bottom:1px solid #ffffff0e}td.n,th.n{text-align:right;font-variant-numeric:tabular-nums}
.good{color:#6ee7b7}.warn{color:#fde68a}.bad{color:#fca5a5}.mut{color:#a5a0c8}code,.mono{font-family:'DejaVu Sans Mono',monospace;font-size:14px;color:#ddd6fe}
.tag{position:absolute;right:46px;bottom:34px;font-size:13px;color:#e9d5ffcc;background:#ffffff14;border-radius:999px;padding:5px 14px}
ul{margin:8px 0 0 0;padding-left:20px}li{margin:5px 0}
h2{margin:0 0 6px;font-size:22px}.sub{color:#a5a0c8;font-size:15px;margin-bottom:6px}
.card{background:#1d1a2e;border:1px solid #ffffff14;border-radius:14px;padding:16px 20px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.step{display:flex;gap:14px;align-items:flex-start}.num{width:34px;height:34px;border-radius:50%;background:#7c3aed;display:flex;align-items:center;justify-content:center;font-weight:700;flex:none}
.tl{display:flex;flex-direction:column;gap:6px}.row{display:flex;gap:12px;align-items:center;font-size:15px}.pill{font:12px 'DejaVu Sans Mono',monospace;padding:2px 8px;border-radius:6px;background:#2a2542;color:#c4b5fd;min-width:92px;text-align:center}
"""
def page(title, inner, tag="Example output"):
    return f"""<!doctype html><meta charset=utf-8><style>{CSS}</style><body><div class=win style="position:relative"><div class=bar><span class=dot style=background:#ff5f57></span><span class=dot style=background:#febc2e></span><span class=dot style=background:#28c840></span><span class=title>{html.escape(title)}</span></div><div class=body>{inner}</div></div><div class=tag>{html.escape(tag)}</div></body>"""
def tbl(head, rows, nums=()):
    h=''.join(f"<th class={'n' if i in nums else ''}>{c}</th>" for i,c in enumerate(head))
    r=''.join('<tr>'+''.join(f"<td class={'n' if i in nums else ''}>{c}</td>" for i,c in enumerate(row))+'</tr>' for row in rows)
    return f"<table><tr>{h}</tr>{r}</table>"
def steps(items):
    return '<div class=grid>'+''.join(f"<div class='card step'><div class=num>{i+1}</div><div><b>{t}</b><div class=mut style='font-size:14.5px;margin-top:4px'>{d}</div></div></div>" for i,(t,d) in enumerate(items))+'</div>'
P={}
# 1 context-cost-audit
P['context-cost-audit-1']=page('Claude Code — context-cost-audit',
 "<div class=u>How much context do these packs cost before I type a word?</div><div class=a><span class=chip>npx rules-bench ./karpathy ./skills ./ecc --window 200000</span>"+
 tbl(['Pack','Startup','% of window','On-demand (all triggered)'],[['karpathy CLAUDE.md + skill','~700','0.3%','~600'],['mattpocock/skills (38 skills)','~1,600','0.8%','~43k'],['ECC rules: common + typescript','~43k','<b class=warn>21%</b>','~985k'],['ECC everything','~113k','<b class=bad>57%</b>','~985k']],(1,2,3))+
 "<p class=mut style='margin:12px 0 0'>Estimates (lower bound on current models). Installing every ECC rule spends over half the window before the first prompt: install <b>common + your language</b> only.</p></div>")
P['context-cost-audit-2']=page('context-cost-audit — what it does',
 "<h2>Startup vs on-demand</h2><div class=sub>Startup is paid every session. On-demand only when something triggers.</div>"+steps([('Locate the pack','A cloned repo or ~/.claude'),('Run rules-bench','npx rules-bench path/to/pack. Zero dependencies, Node 20+'),('Read the split','CLAUDE.md, rules/ and skill name+description vs skill bodies and refs'),('Get recommendations','Move rules into skills, install only needed subfolders, shorten descriptions')]),'Works with npx rules-bench')
# 2 prompt-preflight
P['prompt-preflight-1']=page('Claude Code — prompt-preflight',
 "<div class=u>What will this system prompt cost on Sonnet 5.5? ~1,200 token system + 300 token user message, about 500 tokens out.</div><div class=a><b>Preflight: Sonnet 5.5</b>"+
 tbl(['Metric','Value'],[['Input tokens','1,500 <span class=mut>(estimate)</span>'],['Context window position','<span class=good>0.15%</span> of 1M'],['Cost per call, cold','$0.0080'],['Cost per call, system cached','<span class=good>$0.00584</span>  <span class=mut>(-27%)</span>'],['Cost per 1,000 calls','$8.00 cold / $5.84 cached']],(1,))+
 "<p class=mut style='margin:12px 0 0'>Keep the system prompt first and volatile text (timestamps, user IDs) last so the prefix gets cached.</p></div>")
P['prompt-preflight-2']=page('prompt-preflight — what it checks',
 "<h2>Before the prompt ships</h2><div class=sub>Exact count with your own key, or an honest estimate.</div>"+steps([('Count input tokens','count_tokens if you agree and have a key, else chars/3.7 x 1.3 on 5.x models'),('Window position','Flags 50% and 80% of the model window'),('Cost','Per call and per 1,000 calls, cold and cache-read'),('Caching boundaries','Stable prefix first, volatile content last')]),'Dated price table included')
# 3 claude-api-xray
P['claude-api-xray-1']=page('Claude Code — claude-api-xray',
 "<div class=u>Why did my second call cost less? usage run 1: cache_creation 1200, input 300, output 500. Run 2: cache_read 1200, input 300, output 500. Sonnet 5.5.</div><div class=a><b>X-ray, run 2</b>"+
 tbl(['Segment','Tokens','Rate / 1M','Cost'],[['uncached input','300','$2.00','$0.00060'],['<span class=good>cache read</span>','1,200','$0.20','$0.00024'],['output','500','$10.00','$0.00500'],['<b>total</b>','','','<b>$0.00584</b>']],(1,2,3))+
 "<p style='margin:12px 0 0'><span class=good>Caching is hitting.</span> Run 1 wrote the cache ($0.0086). Run 2 is <b>32% cheaper</b>; the hit saved $0.00216 on the cached prefix.</p></div>")
P['claude-api-xray-2']=page('claude-api-xray — what it checks',
 "<h2>One request, four rates</h2><div class=sub>From the usage block of any Messages API response.</div>"+steps([('Split the segments','input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens'),('Price each one','Per-model rates, Haiku 5.5 long-prompt card handled'),('Is caching working?','Finds timestamps, reordered tools and cache_control mistakes'),('Latency','TTFT on any first content block, throughput')]),'No network access needed')
# 4 agent-trace-debugger
tl=[('user','Should I go for a run today?',''),('thinking','Check weather and air quality first',''),('tool_use','get_weather(city="Istanbul")',''),('tool_result','22°C, clear','good'),('tool_use','get_air_quality(city="Istanbul")',''),('tool_result','is_error: timeout','bad'),('text','Air data unavailable, checking the calendar instead',''),('tool_use','check_calendar(day="today")',''),('tool_result','free after 17:00','good'),('text','Yes. Go after 17:00; 22°C and clear.','')]
tlh='<div class=tl>'+''.join(f"<div class=row><span class=mut style='width:22px'>{i+1}</span><span class=pill>{k}</span><span class={c or ''}>{html.escape(v)}</span></div>" for i,(k,v,c) in enumerate(tl))+'</div>'
P['agent-trace-debugger-1']=page('Claude Code — agent-trace-debugger',
 "<div class=u>Why did my agent skip the air quality check? (pasted messages array)</div><div class=a><b>Timeline</b> <span class=mut>10 steps, 3 tool calls, 1 errored</span>"+tlh+
 "<p style='margin:10px 0 0'><span class=good>Silent recovery</span> at step 7 after the step 6 timeout. <span class=warn>Fix:</span> retry get_air_quality once before giving up.</p></div>",'Built-in sample trace')
P['agent-trace-debugger-2']=page('agent-trace-debugger — failure patterns',
 "<h2>What it looks for</h2><div class=sub>Finished traces only: it never re-runs the agent.</div>"+steps([('Orphaned call','tool_use with no tool_result'),('Unrecovered error','is_error result, then a confident answer'),('Loop','Same tool and input 3+ times'),('Premature answer','Final text no result supports')]),'Pairs with agentreplay.vercel.app')
# 5 prompt-ab-test
P['prompt-ab-test-1']=page('Claude Code — prompt-ab-test',
 "<div class=u>Does my terse system prompt lose anything against the teaching one? Same 4 questions, Sonnet 5.5.</div><div class=a><b>A (terse) vs B (teaching)</b>"+
 tbl(['','A: terse','B: teaching','Ratio'],[['Output tokens','120','510','4.3x'],['Output cost','$0.0012','$0.0051','<span class=good>A 4.3x cheaper</span>'],['Time to first token','0.6 s','0.7 s','~1x'],['Total time','1.9 s','6.2 s','<span class=good>A 3.3x faster</span>'],['Required fields present','4/4','4/4','<span class=good>tie</span>']],(1,2,3))+
 "<p class=mut style='margin:12px 0 0'>Verdict: ship A. Same required content, a fraction of the cost and latency.</p></div>",'Illustrative example')
P['prompt-ab-test-2']=page('prompt-ab-test — method',
 "<h2>Numbers, not vibes</h2><div class=sub>Change one thing at a time, judge against criteria you wrote first.</div>"+steps([('Define variants','Model, system prompt, temperature only where supported'),('3-5 inputs','Include an edge case'),('Collect','Output, tokens, cost, TTFT, total time'),('Verdict','Winner per axis and the trade-off, repeat if close')]),'Pairs with prompt-lab-promptly.vercel.app')
# 6 tool-design-sandbox
P['tool-design-sandbox-1']=page('Claude Code — tool-design-sandbox',
 "<div class=u>Review my three tools and simulate the loop for: find the pricing page for Acme.</div><div class=a><b>Review and simulated run</b>"+
 tbl(['Tool','Verdict','Evidence (simulated)'],[['search_docs(query)','<span class=good>keep</span>','Called with 2 keywords as intended'],['get_doc(id)','<span class=good>keep</span>','Used the id from the search result'],['search(q)','<span class=bad>drop</span>','Overlaps search_docs; agent picked it for a doc lookup'],['timeout on get_doc','<span class=good>recovered</span>','Retried once, then reported the failure']],())+
 "<p class=mut style='margin:12px 0 0'>Tool results were mocked and labelled as such. Run a real test once the design settles.</p></div>",'Illustrative example')
P['tool-design-sandbox-2']=page('tool-design-sandbox — method',
 "<h2>Design the tools before you build them</h2><div class=sub>You play every tool with realistic mocked results.</div>"+steps([('Review schemas','Names, descriptions, parameters, output shape'),('Simulate the loop','Happy path, error, empty, huge payload, ambiguous request'),('Report per tool','Keep, rename, reword, split or drop, with evidence'),('Fix the right layer','Tool changes first, prompt changes last')]),'Pairs with tool-lab-bice.vercel.app')
for k,v in P.items(): open(k+'.html','w').write(v)
print(len(P))
