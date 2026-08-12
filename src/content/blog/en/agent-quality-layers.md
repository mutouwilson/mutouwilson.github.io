---
title: 'Agent quality is a five-layer chain'
description: 'Finishing the task is not the same as handing over a good result. It has to be adopted by the user and produce an effect in real work. Split agent quality into five layers, from running reliably to producing a business outcome, and measure all of them end to end against one denominator.'
pubDate: 2026-08-12
tags: ['Agent engineering', 'quality metrics']
---

## 1. What makes an agent good

Any user-facing product eventually comes back to four things: more, faster, better, cheaper. Is coverage wide enough, is the response fast enough, is the result good enough, is the price reasonable. Agent products are no exception.

For an agent product at the startup stage, better usually matters more than more, faster, cheaper. When a user hands real work like recruiting, sales or research to a new tool and keeps using it, it isn't because the tool is usable. It's because it's genuinely better at some particular step (usually you need a 10x experience there).

There's one trap to get out of the way first: treating "the agent finished" as "the user got a good result." Agents have moved fast over the past two years on tool calling, browser operation and long-task orchestration. Next to the early demos that spun in circles, plenty of systems now run a task to completion reliably, and deliver something that looks complete.

In recruiting, that's only the first step. Our agent did return twenty candidates, but that doesn't mean the twenty actually match. A matching candidate doesn't mean the recruiter will move on it. A recruiter moving on it doesn't mean a reply or an interview. The hard part is walking that chain layer by layer, all the way to a real business result.

## 2. Good, for a recruiting agent, is a five-layer chain

Take a single sourcing request. End-to-end quality for a recruiting agent splits into five layers, forming a chain that runs from system outcome to business outcome. Each layer up sits closer to user value, and gets harder to define and measure.

| Layer | Name | What it means |
| --- | --- | --- |
| L0 | Runs reliably | The task reaches an expected terminal state. No crash, no timeout, no spinning. |
| L1 | Task complete | A delivery the recruiter can pick up, not just the model saying "done." |
| L2 | Delivery correct | Candidates, match judgments, evidence and contact details hold up under checking. |
| L3 | User adoption | The results get saved, accepted, contacted. They enter the recruiting workflow. |
| L4 | Business outcome | Within an agreed window, it produces replies, interviews, offers. |

*Caption: from "it runs" to "it moves the business," every layer filters out some of the tasks.*

Headline metrics, measured end to end.

| Layer / headline metric | End-to-end formula | What it means in recruiting |
| --- | --- | --- |
| L0 reliable-run rate | Tasks reaching an expected terminal state ÷ total evaluable tasks | The browser, data source, model or workflow didn't cut the task short or leave it spinning. |
| L1 task-completion rate | Tasks meeting the delivery contract ÷ total evaluable tasks | At minimum: candidates, match rationale, evidence, contact status and stated limits. |
| L2 delivery-correctness rate | Tasks passing the quality rubric ÷ total evaluable tasks | Hard requirements hit; every key judgment has traceable evidence; unknowns weren't invented. |
| L3 user-adoption rate | Tasks where at least one candidate was saved, accepted or contacted ÷ total evaluable tasks | The recruiter decided the delivery was worth putting into their own pipeline. |
| L4 business-outcome rate | Tasks with a predefined business event inside the attribution window ÷ total evaluable tasks | A real reply, an interview. Different roles need the definition and observation window agreed up front. |

"Evaluable" needs a boundary too. Requests the user cancelled before launch, requests with invalid input, and requests the product explicitly refused before executing should be listed separately as `excluded`, rather than folded into the denominator and explained away afterwards.

## 3. To move the five metrics, look inside the run

Working out how to move the numbers means going back to how one task executes. Agents differ internally, but laid out flat, most of them can't avoid five stages: understand, plan, execute, verify, stop.

| # | Stage | What it does |
| --- | --- | --- |
| 01 | Understand | Turn the JD into executable criteria; spot the ambiguity worth asking the user about. |
| 02 | Plan | Given data-source, time and tool constraints, lay out the search, filtering and evidence-gathering paths. |
| 03 | Execute | Call data sources and tools, handle failures, come back with candidates and raw evidence. |
| 04 | Verify | Check hard requirements against evidence; leave what can't be confirmed as unknown. |
| 05 | Stop | Judge when the contract is met, when to change route or ask for help, and when to deliver partially and say so. |

*Caption: stages are for attribution; the five layers are for measuring the delivery.*

| Stage | Diagnostic metrics | Layers mainly affected | Typical failures |
| --- | --- | --- | --- |
| Understand | Requirement-comprehension accuracy, criteria-extraction completeness, should-have-asked rate. | L1 task completion, L2 delivery correctness | Treating a must-have as a nice-to-have; dropping a location, seniority or industry constraint. |
| Plan | Critical-path coverage, resource-constraint coverage, replan soundness. | L0 reliable run, L1 task completion | Not accounting for browser permissions or data-source limits; no backup path when candidates run short. |
| Execute | Tool-choice accuracy, parameter accuracy, action success rate, repeated-action rate. | L1 task completion, L2 delivery correctness | Pagination repeating, DOM selector drift, the wrong source picked, contact enrichment failing. |
| Verify | Verifier precision and recall, evidence coverage, agreement with human judgment. | L2 delivery correctness, L3 user adoption | A candidate looks like a fit but the evidence is thin; the judge lets through an inference with no source. |
| Stop | Early-stop rate, over-execution rate, spin rate, wrap-up quality at the soft cap. | L1 task completion; also cost and latency | Committing before the list is long enough; still calling tools once the shortlist is already satisfied. |

The easiest mistake here is treating process metrics as quality itself. A plan can read as complete and the candidates still be wrong. Every tool call can succeed and the contact details still be dead. Process metrics only explain things: why L2 dropped, why L1 never formed, why L0 didn't hold. Optimization starts from the end-to-end result, then walks back along the trace.

## 4. Building a system that actually lands

### 4.1 Write the task contract first

Every sourcing request should start out with a structured role, location, seniority, must-haves, exclusions, expected candidate count, data-source boundary and target event. Completion isn't the model's call to make; the contract decides it. When the market is thin, delivering "not enough results, and here is what was searched and verified" can be a good completion. Pretending you found enough is not.

### 4.2 Keep an execution record you can replay

Every step's tool call, input, return, error, retry, verification conclusion and stop reason goes into the trace. From the logs you can work out why L0 dropped on a given batch: a browser gate, data-source rate limiting, or the same action repeating? For a candidate that failed L2: was the retrieval source wrong, or did the criteria check miss it?

### 4.3 Make the delivery a checkable structure

Candidates, each match judgment, its evidence, contact details, unknowns, stated limits. Structure all of it as far as you can. Then L1 can check delivery completeness automatically, and L2 can be sampled against a rubric, instead of making a reviewer guess from a paragraph of prose what the model actually did.

### 4.4 Calibrate correctness with people, and don't treat the judge as truth

An LLM judge is good for widening coverage, but it can't define correct on its own. Sample weekly, stratified across roles, regions and failure types, and have people label hard requirements, evidence correctness and honesty about unknowns. Those labels are what calibrates the automated rubric. External agent benchmarks have already moved from static answers to task outcomes inside an environment; our advantage is that the recruiting business itself owns criteria, candidate data and recruiter review that sit much closer to real value. [AgentBench](https://arxiv.org/abs/2308.03688), [OSWorld](https://arxiv.org/abs/2404.07972), [τ-bench](https://arxiv.org/abs/2406.12045)

### 4.5 Wire up the user and business feedback loop

L3 and L4 signals don't turn up in the trace by themselves. The product has to record whether the recruiter saved, accepted or contacted, and the reason when they rejected; then pull reply and interview events back from the ATS or the outreach flow. L4 is the noisiest of the five, so it suits monthly observation by role cohort, compared against manual sourcing or a historical baseline, rather than one week's swing driving a prompt change.

> Start with the traces you already have and compute L0 and L1. Then build a small golden set and human sampling, and get a trustworthy L2. Then fill in accepted, contacted and reject reason, and start watching L3. Only after that wire L4 to cohorts.
>
> The reason for that order: each time you add a layer of data, the layer under it already has an explainable basis. It stacks.

## Closing

For an agent, good shouldn't be a vague satisfaction score, and it isn't how nicely the model answered on one occasion. It's a five-layer chain running from reliable execution through to actual business effect. Break the chain apart and you can see two things at once: whether the final value happened, and which stage to go back to — understand, plan, execute, verify or stop.

Running to completion is where an agent starts. Delivering something correct that the user actually adopts is where it starts becoming a production product.

## References

- Liu et al., _AgentBench: Evaluating LLMs as Agents_, 2023 — [arXiv:2308.03688](https://arxiv.org/abs/2308.03688)
- Xie et al., _OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments_, 2024 — [arXiv:2404.07972](https://arxiv.org/abs/2404.07972)
- Yao et al., _τ-bench: A Benchmark for Tool-Agent-User Interaction in Real-World Domains_, 2024 — [arXiv:2406.12045](https://arxiv.org/abs/2406.12045)
- Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)
- OpenAI, [GDPval: evaluating AI on economically valuable work](https://openai.com/index/gdpval/)
