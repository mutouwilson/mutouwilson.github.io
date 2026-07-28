---
title: A brief history of AgentOS engineering
# Quoted: an unquoted YAML scalar cannot contain ': '.
description: 'From prompt engineering to self-evolution — five eras of agent engineering in six years, all of them patching the same thing: the CPU is probabilistic.'
pubDate: 2026-07-27
tags: ['AgentOS', 'Agent engineering']
---

## 1. Where AgentOS came from

One thing to clear up first: more than one company now ships a product literally named "AgentOS". The AgentOS in this post is a conceptual frame, not any of them.

In November 2023 Karpathy posted a tweet with a now-famous sketch, drawing the LLM ecosystem as a computer. It read like a spec sheet: "LLM OS — processor: GPT-4 Turbo, 256 cores (batch size), clock 20Hz (tok/s); memory: 128K tokens; file system: Ada002."

"The LLM is the CPU of a new kind of computer" got out into the world with that tweet.

A month later Rutgers published _LLM as OS, Agents as Apps_ and drew the full mapping; a quarter after that the same lab turned the drawing into a real system: AIOS, an agent kernel with a scheduler, a memory manager and an access manager.

What this post is about is how the engineering around that idea actually developed. In the six years since GPT-3 it has changed shape four times — prompt engineering, context engineering, harness engineering, loop engineering — plus a fifth era people are still feeling their way through: an AgentOS that improves itself.

<div class="timeline">
<ol>
<li>
<p class="timeline-era"><span class="timeline-span">2020–2023</span> Prompt engineering</p>
<p class="timeline-note">No system software at all. Programming the bare metal: one task is one call, and everything is zeroed when it returns.</p>
<ul class="timeline-marks">
<li><time datetime="2020-05">2020-05</time><span>GPT-3, few-shot prompting works</span></li>
<li><time datetime="2022-01">2022-01</time><span>Chain-of-Thought</span></li>
<li><time datetime="2023-05">2023-05</time><span>Tree of Thoughts</span></li>
</ul>
</li>
<li>
<p class="timeline-era"><span class="timeline-span">2023–2025</span> Context engineering</p>
<p class="timeline-note">Memory and disk get filled in. The model itself never moves; everything fed to it does.</p>
<ul class="timeline-marks">
<li><time datetime="2020-05">2020-05</time><span>RAG paper published, with nothing much to use it on yet</span></li>
<li><time datetime="2022-10">2022-10</time><span>LangChain, LlamaIndex</span></li>
<li><time datetime="2025-06">2025-06</time><span>"context engineering" settles into a name</span></li>
</ul>
</li>
<li>
<p class="timeline-era"><span class="timeline-span">2024–2026</span> Harness engineering</p>
<p class="timeline-note">Kernel, sandbox and process management get filled in. Loose parts become a whole machine.</p>
<ul class="timeline-marks">
<li><time datetime="2022-10">2022-10</time><span>ReAct writes think-act-observe as an explicit loop</span></li>
<li><time datetime="2023-06">2023-06</time><span>OpenAI function calling</span></li>
<li><time datetime="2024-03">2024-03</time><span>Devin, SWE-bench from 1.96% to 13.86%</span></li>
<li><time datetime="2025-03">2025-03</time><span>Manus, a whole machine in a cloud sandbox</span></li>
</ul>
</li>
<li>
<p class="timeline-era"><span class="timeline-span">2026–</span> Loop engineering</p>
<p class="timeline-note">The scheduler finally stands up. The hard part was never making it spin — it is defining when it stops.</p>
<ul class="timeline-marks">
<li><time datetime="2025">2025</time><span>Ralph, a loop in one line of bash</span></li>
<li><time datetime="2026-03">2026-03</time><span>Claude Code /loop</span></li>
<li><time datetime="2026-05">2026-05</time><span>/goal, the finish condition goes to an independent evaluator</span></li>
</ul>
</li>
<li>
<p class="timeline-era"><span class="timeline-span">2026–</span> Recursive self-improvement</p>
<p class="timeline-note">Still exploratory. Bounded for now, not exploding.</p>
<ul class="timeline-marks">
<li><time datetime="2025">2025</time><span>Darwin Gödel Machine, SWE-bench from 20% to 50%</span></li>
<li><time datetime="2025">2025</time><span>SEAL, a model editing its own weights</span></li>
</ul>
</li>
</ol>
</div>

## 2. Against a conventional OS

Conventional computer on the left, agent system on the right:

| Conventional computer | AgentOS                                          | Notes                                                                        |
| --------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| CPU                   | the model                                        | the only compute unit                                                        |
| Clock cycle           | one forward pass                                  | one tick per token; the "clock speed" is tok/s                               |
| CPU cache (L1/L2)     | KV cache / prompt cache                          | a hit or a miss is a 10× price difference (Claude Sonnet: $0.30 cached read vs $3/MTok input) |
| RAM                   | the context window                                | small, fastest to reach, wiped when the task ends                            |
| Virtual memory paging | context compaction and offload                    | when it fills, the inactive part gets swapped out (MemGPT)                   |
| Disk / file system    | external memory and files (cloud, local, vector store) | large, durable, slower to reach                                          |
| Syscall               | tool call (function calling)                      | the model asking for a capability it does not have                           |
| Network protocol      | MCP, A2A and other inter-agent protocols          | MCP connects peripherals (the official analogy is USB-C), A2A connects hosts  |
| Process               | one agent task                                    | a sub-agent is roughly a forked child                                        |
| Interrupt             | HITL, hooks                                       | an outside event cutting into the flow                                       |
| Protected mode        | sandbox, permissions, guardrails                  | keeping the program from writing where it should not                         |

There is one difference from a conventional CPU that matters more than the rest.

A conventional CPU is deterministic. Same instruction, same input, same output, forever.

An LLM is probabilistic: the same prompt can answer differently on two runs; it will execute, with a straight face, an "instruction" that does not exist; its accuracy is a distribution, not a guarantee.

Nothing in the history of operating systems ever had to defend against the CPU hallucinating an instruction, and almost all of agent engineering for the last few years has been patching around that single difference. The same thing keeps happening: a subsystem gets carried over from a conventional OS and comes out the other side unrecognisable, reshaped to fit a probabilistic processor.

A definition worth trying:

> **AgentOS: a layer of system software that manages a probabilistic processor's compute (model calls), memory (context), storage (external memory), I/O (tools and protocols) and scheduling (the execution loop) — assembling one unreliable CPU into a reliable computer.**

The rest of this is that system software in the order it arrived.

## 3. Prompt engineering (2020–2023)

GPT-3 (May 2020) proved few-shot prompting worked: no fine-tuning, just put the examples in the input and the model does the job. There was no "system software" of any kind, so it was bare-metal programming. One task was one function call; the call returned and everything was gone.

What the era produced was a pile of prompt tricks. Chain-of-Thought (Google, January 2022) found that telling the model to think step by step lifted reasoning a long way; Tree of Thoughts (May 2023) widened a single chain into a search tree; and the community accumulated calling conventions on top — assign a role, give a template, ask for Markdown, "you are a senior expert". We called it prompt engineering. Looking back it was the same activity as early programmers hand-writing assembly and working out calling conventions: **squeezing a processor by technique, on a machine with no operating system**.

Context windows were tiny then. GPT-3 had 2048 tokens; the mainstream models after it were 16K, 32K. Everything you put in was expensive — instructions, few-shot examples and the user's actual question all competing for the same space, and one more example meant deleting something else. Models were also lost in the middle. So assembling the context was itself the skill: what goes in, how much, in what order, instructions at the top or the bottom, all of it tuned by hand.

## 4. Context engineering (2023–2025)

The phrase only caught on in 2025, but the work started when RAG did. The first wall everyone hit after ChatGPT was that the model does not know your things. Knowledge frozen at the training cutoff, and a context window that was miserably small: 4K tokens on GPT-3.5, 8K on the first GPT-4. And the first thing every company wanted was identical — "can it answer questions about our own documents?" Bare metal cannot do that: the context is too small and there is no interface to external storage.

The RAG paper had actually been out since 2020, published almost the same week as GPT-3, with nothing much to use it on at the time. What changed was LangChain (2022-10) and LlamaIndex (2022-11); 2023 carried them up with the rest of the ChatGPT ecosystem, and took an entire vector-database category along with it.

RAG is not complicated: offline, chunk the documents, embed them, put them in a vector store; at question time, embed the question too, pull back the few most similar chunks, staple them into the prompt and let the model answer with the material in front of it. Note that the model does not move at all through any of this. What moves is the context it is handed.

The payoff was immediate: new knowledge without retraining, internal documents you could ask questions of, answers with citations, at a cost some orders of magnitude below fine-tuning. For a while in 2023, "enterprise knowledge-base Q&A" was what an AI application meant.

Anyone who shipped one knows the distance between the demo and production. Chunking cuts through meaning; "similar" is not "relevant"; ask it to compare approach A with approach B and retrieval comes back with A. So you tune chunk size, tune top-k, swap the embedding model, and it turns into folklore. There were two more fundamental limits that few people saw clearly at the time. RAG is read-only — the model can look at the outside world but cannot move it (querying a database, yes; changing one, no). And it is single-hop: retrieve once, answer once, pipeline fixed, when a hard question needs look a little, think a little, look again.

What actually survives from this period is a very basic question: what goes into the context, how much of it, in what order. That question kept growing, from stapling retrieved text into a whole engineering discipline — the context engineering that finally got a shared name in June 2025.

## 5. Harness engineering (2024–2026)

RAG does not make an agent move. What you want is an agent that can act across many steps, and someone had already tried that in the spring of 2023: AutoGPT let GPT-4 plan for itself, call its own tools, run its own loop, and was the star of GitHub for a while. It was quickly found to be unusable — going in circles, drifting off, burning tens of dollars overnight to produce a directory of garbage. In hindsight the problem was not the loop. It was that there was nothing underneath the loop: no isolated execution environment, no error recovery, no state, no constraint on dangerous actions. Those gaps are what harness engineering came out of.

ReAct (October 2022) wrote think a step, do a step, look at the result as an explicit loop; Toolformer (February 2023) let a model learn for itself when to call an API; in June 2023 OpenAI shipped function calling and tool use became an official part of a model API for the first time. Nobody had assembled them, though — they were a heap of parts. The whole machine showed up with Devin (Cognition, March 2024): "equipped with a shell, a code editor and a browser, running in a sandboxed compute environment", resolving 13.86% of SWE-bench issues end to end where the previous best was 1.96%.

Exactly which parts make up a harness differs by vendor, but line up the component lists from the Claude Agent SDK, the OpenAI Agents SDK and LangGraph and you get roughly six, each with a prototype in an OS:

<figure>
<div class="stack">
<ol>
<li><span class="stack-part">Tools and action interface (ACI)</span><span class="stack-os">instruction set / syscall convention</span></li>
<li><span class="stack-part">Context management and compaction</span><span class="stack-os">memory management and paging</span></li>
<li><span class="stack-part">Memory and state</span><span class="stack-os">registers + disk</span></li>
<li><span class="stack-part">Sub-agent orchestration</span><span class="stack-os">multiprocessing and fork</span></li>
<li><span class="stack-part">Verification and self-correction</span><span class="stack-os stack-none">no counterpart in an OS</span></li>
<li><span class="stack-part">Permissions and control</span><span class="stack-os">protected mode</span></li>
</ol>
<div class="stack-cross">Observability · dmesg / strace</div>
</div>
<figcaption>Six parts, five with a prototype in an OS. The one without is exactly what a probabilistic CPU forces into existence.</figcaption>
</figure>

- **Tools and action interface (ACI) = instruction set and calling convention**. The term comes from SWE-agent: which tools an agent can reach, how an action is expressed, how the environment answers back — that decides whether it can work at all.
- **Context management and compaction = memory management and paging**. Within one task the context fills up with tool results, so the harness has to decide dynamically what goes in, compact or evict what has gone inactive, and clear room for the next step. Manus using the file system as external memory and Claude Code's automatic compaction are the reference cases.
- **Memory and state = registers + disk**. Almost everyone splits this in two: short-term thread state (sessions, checkpoints, so a task can suspend, resume and roll back) and long-term cross-session memory (structured notes, an external store, a CLAUDE.md). The first is the register state saved when a process is swapped out; the second is data written to disk. The long-term layer is still crude — on LongMemEval, mainstream models lose 30% accuracy on cross-session memory tasks.
- **Sub-agent orchestration = multiprocessing and fork**. Hand a piece of work to a sub-agent with its own context window and bring back only the conclusion. OpenAI lists handoff as a core primitive; Anthropic uses it to split planner, executor and evaluator. It buys parallelism and isolation at once: a sub-agent dirtying its context does not touch the main line.
- **Verification and self-correction**. This one has no counterpart in a conventional OS — a deterministic CPU is simply right when it finishes, and nobody verifies that an addition added correctly. A probabilistic CPU returns results that look reasonable and are wrong, so a harness has to add a check after every step: run the tests, diff against the design, put a second model in the judge's seat.
- **Permissions and control = protected mode**. Which tools may run, whether a dangerous action needs a human, whether code runs in a sandbox, and how any of it is granted: permission modes, tool allowlists, hooks.

Plus one cross-cutting concern: **observability = logs and tracing**. Model output is unstable, so unless you can replay what happened at every step and find where it went off, there is nothing to debug or evaluate against (LangSmith, Langfuse and OpenAI's built-in tracing all exist for this). It is dmesg and strace.

The best-known practice early in this era was Manus (6 March 2025): a complete virtual computer in a cloud sandbox — browser, shell, file system, code execution, plus autonomous planning. Peak Ji's _Context Engineering for AI Agents_ (July 2025) is a genuinely useful engineering retrospective from the harness years. Its main points: KV-cache hit rate is the first metric to watch (a hit or a miss is 10× the price), mask tools with logits rather than adding and removing them dynamically (which destroys the cache), use the file system as unbounded context, recite the goal back into the attention window by rewriting todo.md, and **leave the failed attempts in the context** — "error recovery is the clearest signal of real agentic behaviour".

Anthropic later compressed the era's methodology into one line, in _Harness design for long-running application development_ (March 2026): **"every component in a harness encodes an assumption about what the model cannot yet do for itself."** Those assumptions may have been wrong from the start, and they expire as models get stronger.

## 6. Loop engineering (2026–)

By 2026 there is a new term going around: loop engineering. The earliest form is Ralph, from Geoffrey Huntley in mid-2025, whose pure expression is one line of bash — `while :; do cat PROMPT.md | claude-code ; done` — an agent reading the same prompt over and over. What pushed it into the mainstream was Boris Cherny, who wrote Claude Code, with a line from an Anthropic developer conference that has been quoted ever since: "I don't prompt Claude any more. I write loops, and the loop prompts it."

AutoGPT had the idea in 2023. The difference is that this time there is an entire harness era underneath the loop, so writing one went from building an empty shell to orchestrating primitives that already work. How those primitives were folded into a single loop, one at a time, is legible straight from the Claude Code changelog:

| Date    | Feature                                             | What it absorbed                                                                     |
| ------- | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 2025‑02 | research preview                                    | the agent loop in a terminal, productised                                            |
| 2025‑05 | GA + SDK                                            | the harness itself becomes a reusable component                                       |
| 2025‑07 | Hooks                                               | verification externalised into deterministic scripts; a Stop hook can block a loop that wants to knock off early |
| 2025‑07 | Subagents                                           | delegation and context isolation become primitives (forking a child)                 |
| 2025‑09 | Checkpoints / rewind; SDK renamed Claude Agent SDK  | state snapshots and reversible execution; the harness generalises from coding to agents |
| 2025‑10 | Agent Skills                                        | capability loaded progressively, so the action space grows without bursting the context |
| 2025‑11 | Code execution with MCP                             | an action goes from N discrete tool calls to the model writing code (150k tokens down to 2k on the example task) |
| 2026‑05 | /goal                                               | a durable finish condition: at the end of each round an independent evaluator decides whether it can actually stop |

Ralph left behind a few recipes that turned out to generalise:

- start each round on a clean context (a long loop's context gets dirtier as it rolls);
- keep state out of the context and on the file system (a plan and a progress log, re-read next round);
- give every plan item a success criterion, check it yourself when done, and start over on a clean context if it was not met;
- spawn sub-agents for parallelism and keep the main line single-threaded (Cognition's "Don't Build Multi-Agents" and Anthropic's "multi-agent beat single-agent by 90%" argued this out in 2025; the consensus it converged on is read in parallel, write single-threaded).

By 2026 mainstream harnesses ship the recipe as built-in commands: Claude Code's `/loop` (March) and `/goal` (May), with Codex and Hermes shipping `/goal` around the same time. The `/goal` documentation is blunt about it — set a finish condition and let it work until the condition holds. The hard part of writing a loop was never getting it to spin. It is defining when it stops.

Loops also magnified the cost problem. On the same task, token consumption between agents can differ by 30×, and spending more does not mean getting it right. Plenty of people tried it and gave up, put off by the drift and the bill.

## 7. Recursive self-improvement (RSI, 2026–)

RSI has been getting louder over the last couple of months: letting an agent improve itself, and then improve the logic by which it improves itself. The idea is old — I.J. Good wrote about an intelligence explosion in 1965, and Schmidhuber's Gödel Machine gave it a strict form in 2003: prove a self-rewrite is beneficial, and only then execute it. It stayed stuck on proving the benefit. LLMs revived it for two reasons. The improver and the thing being improved live in the same medium for the first time — what the model reads and writes is exactly the prompts, tools and code its own scaffold is made of. And "proof" got swapped for benchmark scores, which are far cheaper.

The systems that actually exist, shallowest first:

<figure>
<ol class="tiers">
<li><p class="tier-name"><span>Artifact level</span>edits memory, skill libraries, prompts</p><p class="tier-fact">reversible · hardest verifier</p></li>
<li><p class="tier-name"><span>System level</span>edits the scaffold that calls it</p><p class="tier-fact">reversible · score replaces proof</p></li>
<li><p class="tier-name"><span>Weight level</span>edits the model's own weights</p><p class="tier-fact">irreversible · softest verifier</p></li>
</ol>
<figcaption>The deeper it goes, the less reversible the change — and the softer the verifier that could tell you whether it worked.</figcaption>
</figure>

**Artifact level**: the artifacts improve; the model doing the task does not change.

- Memory: Letta has a background agent tidy memory while it is idle, like defragmenting overnight
- Skill libraries: Voyager accumulates executable code skills; SkillOS curates them with RL
- Prompts: GEPA evolves the prompt with a genetic algorithm

**System level**: systemic improvement that closes the loop.

- STOP and ADAS have a fixed model rewrite the scaffold that calls it. STOP's authors said it themselves — the model is untouched, so it is not full RSI — and ADAS's meta-agent is fixed too
- Sakana's Darwin Gödel Machine (2025) goes further: it edits its own code, keeps an evolutionary archive, and substitutes benchmark scores for proof, climbing SWE-bench from 20% to 50% over 80 iterations. It is arguably the only system so far that genuinely runs multi-round self-referential recursion

**Weight level**: the deepest layer.

- MIT's SEAL has the model generate its own fine-tuning data and update its own weights. It is also the first to run into catastrophic forgetting

It is a long way from an intelligence explosion, for reasons that are structural rather than temporary. First, the recursion only closes in domains that are cheap to verify, like coding, and one DGM run takes two weeks and a lot of money. The harder the verifier (compilation, tests) the more real the improvement; the softer it is (human preference, models grading each other) the more hollow. A 2026 RSI survey calls this the verifier hardness gradient and concludes that RSI at this stage is bounded, not explosive. Second, self-improvement actively collapses: train recursively on your own generated data and the tail of the distribution disappears (model collapse, Nature 2024); use yourself as the reward signal and RL can suddenly collapse into a constant answer (SRT); and even verifiers get gamed.

## 8. What follows from this

Two lines run through all five eras.

**One: every era was filling in a subsystem for a probabilistic CPU.** Prompting filled in the calling convention, RAG filled in memory and disk, the harness filled in the kernel, the sandbox and process management, the loop finally stood the scheduler up, MCP and A2A filled in drivers and networking. Read the other way, that is simply the list of things you need in order to manage one compute unit in a von Neumann machine.

**Two: scaffolding usually ends up absorbed.** CoT was a prompt trick and reasoning models internalised it; RAG was mandatory architecture and long context plus retrieval training ate most of its use cases; the harness's planning, verification and guardrails are being folded into the loop as primitives; and the loop itself is being trained into weights end to end, which is plausibly how OpenAI's deep research was built.

<figure>
<div class="dgm">
<svg viewBox="0 0 640 252" role="img" aria-labelledby="dgm-absorb-t dgm-absorb-d">
<title id="dgm-absorb-t">How scaffolding gets absorbed</title>
<desc id="dgm-absorb-d">Three levels, top to bottom: upper scaffolding, kernel and primitives, model weights. CoT and RAG sink from scaffolding straight into the weights, absorbed by reasoning models and by long context plus retrieval training. Harness planning and verification sink one level, folded into loop primitives. The loop itself is then trained into the weights by end-to-end RL.</desc>
<defs><marker id="dgm-absorb-head" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L8 4 L0 8 z" class="dgm-head" /></marker></defs>
<text x="124" y="28" class="dgm-label">time →</text>
<text x="110" y="74" class="dgm-soft" text-anchor="end">scaffolding</text>
<text x="110" y="149" class="dgm-soft" text-anchor="end">kernel / primitives</text>
<text x="110" y="224" class="dgm-soft" text-anchor="end">model weights</text>
<line x1="124" y1="70" x2="628" y2="70" class="dgm-rule" />
<line x1="124" y1="145" x2="628" y2="145" class="dgm-rule" />
<line x1="124" y1="220" x2="628" y2="220" class="dgm-rule" />
<circle cx="185" cy="70" r="3" class="dgm-head" /><text x="185" y="58" class="dgm-text" text-anchor="middle">CoT</text>
<path d="M185 74 L185 212" class="dgm-arrow" marker-end="url(#dgm-absorb-head)" />
<text x="185" y="240" class="dgm-soft" text-anchor="middle">reasoning models</text>
<circle cx="330" cy="70" r="3" class="dgm-head" /><text x="330" y="58" class="dgm-text" text-anchor="middle">RAG</text>
<path d="M330 74 L330 212" class="dgm-arrow" marker-end="url(#dgm-absorb-head)" />
<text x="336" y="240" class="dgm-soft" text-anchor="middle">long context + retrieval</text>
<circle cx="470" cy="70" r="3" class="dgm-head" /><text x="470" y="58" class="dgm-text" text-anchor="middle">harness planning</text>
<path d="M470 74 L470 137" class="dgm-arrow" marker-end="url(#dgm-absorb-head)" />
<text x="470" y="164" class="dgm-soft" text-anchor="middle">folded into loop primitives</text>
<circle cx="586" cy="145" r="3" class="dgm-head" /><text x="586" y="133" class="dgm-text" text-anchor="middle">loop</text>
<path d="M586 149 L586 212" class="dgm-arrow" marker-end="url(#dgm-absorb-head)" />
<text x="586" y="240" class="dgm-soft" text-anchor="middle">end-to-end RL</text>
</svg>
</div>
<figcaption>Every generation of scaffolding sinks. Whatever reaches the weights stops being anyone's advantage.</figcaption>
</figure>

Which raises the question worth asking: what does not get absorbed? Look at conventional computers again. CPUs got a million times faster over fifty years and operating systems kept getting thinner, but they never disappeared. Three things never belonged to the CPU in the first place: private data (memory and context as an asset), business criteria (what counts as having done the task right, which comes from the business), and verifiers (ground truth independent of the compute unit). Every generation the model gets stronger, AgentOS gets one layer thinner. The layer that is left is the one worth investing in.

Follow that down and, if you are building an agent product, you arrive at a judgement: the advantage is not in the kernel, it is in the layer above.

Taking AgentOS layer by layer:

- The kernel — model calls, context management, tool protocols, the execution loop — will commoditise, converge on a handful of vendors, and be defined mostly by the model companies. Partly because the kernel's most valuable pieces (KV cache, compaction, training planning and verification into the weights) sit against the model weights, where nobody else can do them best; partly because the protocols are standardising in the open — A2A is already with the Linux Foundation, on the path TCP/IP and POSIX took rather than the path of proprietary operating systems. Competing on an in-house kernel has no future for an application company.

- The layer above is where the advantage is, but it comes in two kinds. One is product advantage — UI, built-in features — which can open a gap for a while and, like countless apps eaten by a platform's native features before it, can be absorbed by the platform at any time. The other is structurally safe: the data, the criteria and the verifiers bound to your own business, which are the three things above. However strong the platform gets, it cannot take the business data you accumulated, your definition of what counts as doing this task right, or your way of independently verifying whether the result holds up.

So the weight goes on the upper layer. A lot of teams have built basic capability themselves, mostly because the OS is still incomplete and there was no other way to ship. Two things are worth preparing for. First, keep the kernel capability you built behind a clean interface, written against where the standard is going rather than against this implementation of it, so that swapping it out later is fast and affordable. Second, the parts genuinely worth going deep on are the ones growing in the seams of the kernel — stop calibration, domain verifiers — which look like kernel work and are in fact a moat bound to the business.

---

## References

- Brown et al., _Language Models are Few-Shot Learners_ (GPT-3), 2020-05 — [arXiv:2005.14165](https://arxiv.org/abs/2005.14165)
- Lewis et al., _Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks_, 2020-05 — [arXiv:2005.11401](https://arxiv.org/abs/2005.11401)
- Wei et al., _Chain-of-Thought Prompting Elicits Reasoning in Large Language Models_, 2022-01 — [arXiv:2201.11903](https://arxiv.org/abs/2201.11903)
- Yao et al., _ReAct: Synergizing Reasoning and Acting in Language Models_, 2022-10 — [arXiv:2210.03629](https://arxiv.org/abs/2210.03629)
- Schick et al., _Toolformer: Language Models Can Teach Themselves to Use Tools_, 2023-02 — [arXiv:2302.04761](https://arxiv.org/abs/2302.04761)
- Yao et al., _Tree of Thoughts: Deliberate Problem Solving with Large Language Models_, 2023-05 — [arXiv:2305.10601](https://arxiv.org/abs/2305.10601)
- Liu et al., _Lost in the Middle: How Language Models Use Long Contexts_, 2023-07 — [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)
- Packer et al., _MemGPT: Towards LLMs as Operating Systems_, UC Berkeley, 2023-10 — [arXiv:2310.08560](https://arxiv.org/abs/2310.08560). Virtual context management: a RAM/disk hierarchy, paging, interrupts. Later became Letta (out of stealth 2024-09).
- Karpathy, the "LLM OS" tweet (2023-11-11) and the _Intro to Large Language Models_ talk (2023-11)
- Zhang et al. (Rutgers), _LLM as OS, Agents as Apps_, 2023-12 — [arXiv:2312.03815](https://arxiv.org/abs/2312.03815); from the same lab, _AIOS: LLM Agent Operating System_, 2024-03 — [arXiv:2403.16971](https://arxiv.org/abs/2403.16971)
- Cognition, _Introducing Devin_, 2024-03-12 — [cognition.com](https://cognition.com/blog/introducing-devin)
- Yang, Jimenez et al., _SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering_, NeurIPS 2024 — [arXiv:2405.15793](https://arxiv.org/abs/2405.15793)
- Shumailov et al., _AI models collapse when trained on recursively generated data_, Nature, 2024-07
- Cognition, _Don't Build Multi-Agents_, 2025-06-12 — [cognition.com](https://cognition.com/blog/dont-build-multi-agents)
- Anthropic, _How we built our multi-agent research system_, 2025-06
- Peak Ji, _Context Engineering for AI Agents: Lessons from Building Manus_, 2025-07
- I.J. Good, _Speculations Concerning the First Ultraintelligent Machine_, Advances in Computers vol. 6, 1965
- Schmidhuber, _Gödel Machines: Self-Referential Universal Problem Solvers_, 2003
- Gergely Orosz / Addy Osmani, _What is Loop Engineering?_, The Pragmatic Engineer
- OpenAI, _Introducing deep research_
