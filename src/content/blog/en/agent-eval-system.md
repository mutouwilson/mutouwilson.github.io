---
title: 'An agent evaluation system'
description: 'An agent evaluation system has to answer: what kind of work are we evaluating? How is one delivery judged? How are two approaches compared? And how do online results come back into the system? Only connected together do these questions become an evaluation system that can steer product iteration.'
pubDate: 2026-08-13
tags: ['Agent engineering', 'evaluation']
---

Model evaluation usually starts from a question and a reference answer. Agents are different. An agent works in an environment: it has to understand an incomplete request, plan a path, call tools, make judgments inside changing data sources, and deliver something a person can pick up. For a real product there is a harder question waiting at the end: did this delivery actually help the user get their work done?

So the goal of agent evaluation shouldn't just be ranking models. It's building a product language: when someone says "this version is better," everyone knows which tasks it got better on, on what evidence, and whether that holds up in real business use.

> An agent evaluation system has to connect at least four things into one loop: the task set, the grading method, the comparison mode, and online feedback.

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 740 250" role="img" aria-labelledby="sysmapt">
<title id="sysmapt">The parts of an agent evaluation system and its loop: product tasks feed the eval dataset, graded runs feed release decisions, and online results and bad cases flow back to update the dataset</title>
<text x="20" y="24" font-family="var(--sans)" font-size="10" font-weight="600" letter-spacing=".06em" fill="var(--d-old)">AN AGENT EVALUATION SYSTEM</text>
<rect x="20" y="48" width="150" height="70" rx="4" fill="var(--d-fill)" stroke="var(--d-faint)" stroke-width="1.2"/>
<rect x="200" y="48" width="170" height="70" rx="4" fill="var(--d-fill-2)" stroke="var(--d-accent)" stroke-width="1.2"/>
<rect x="400" y="48" width="170" height="70" rx="4" fill="var(--d-fill)" stroke="var(--d-faint)" stroke-width="1.2"/>
<rect x="600" y="48" width="120" height="70" rx="4" fill="var(--d-fill)" stroke="var(--d-faint)" stroke-width="1.2"/>
<rect x="370" y="151" width="200" height="70" rx="4" fill="var(--d-fill)" stroke="var(--d-faint)" stroke-width="1.2"/>
<rect x="150" y="151" width="190" height="70" rx="4" fill="var(--d-fill)" stroke="var(--d-faint)" stroke-width="1.2"/>
<g fill="none" stroke="var(--d-accent)" stroke-width="1.2">
<path d="M170 83 H192"/>
<path d="M370 83 H392"/>
<path d="M570 83 H592"/>
<path d="M660 118 V151 H570"/>
<path d="M370 186 H340"/>
<path d="M245 151 V134 C245 130 251 127 258 127 H276 V118"/>
</g>
<g fill="var(--d-accent)">
<path d="M192 83 l-7 -4 v8 z"/>
<path d="M392 83 l-7 -4 v8 z"/>
<path d="M592 83 l-7 -4 v8 z"/>
<path d="M570 151 l7 -4 v8 z"/>
<path d="M340 186 l7 -4 v8 z"/>
<path d="M276 118 l-4 7 h8 z"/>
</g>
<g font-family="var(--sans)" font-size="14" font-weight="600" fill="var(--d-ink)">
<text x="34" y="76">Product tasks</text>
<text x="214" y="76">Eval dataset</text>
<text x="414" y="76">Grading config</text>
<text x="614" y="76">Eval runs</text>
<text x="384" y="179">Release decisions</text>
<text x="164" y="179">Results &amp; bad cases</text>
</g>
<g font-family="var(--sans)" font-size="10.5" fill="var(--d-old)">
<text x="34" y="98">Real work &amp; requests</text>
<text x="214" y="98">Task × scenario × capability</text>
<text x="414" y="98">L0–L3 &amp; evidence rules</text>
<text x="614" y="98">Absolute / relative</text>
<text x="384" y="201">Regression gates &amp; choices</text>
<text x="164" y="201">Adoption, replies, failures</text>
</g>
</svg>
</div>
<figcaption>Evaluation isn't a one-off offline run — it's a loop. Product tasks decide the question set, the question set decides the grading configs; online results and bad cases flow back and update it.</figcaption>
</figure>

## 1. Start from the product's tasks

Plenty of evaluation projects open by debating metrics or judges. The first thing to do is actually to break down the work the product really takes on. Different tasks have different ground truth: some have a definite answer, some can only be judged by a domain expert, and some can't be judged until user behavior has happened.

Start from the concrete business. First the recruiting workflow: from requirement clarification, through talent research and search, initial screening, outreach and follow-through, to interviews, selection and hire. That is the business map the product serves. Against it sit the evaluation task types: they don't try to retell the whole HR process — they carve out the units of work an agent can be evaluated on independently, by ground truth and delivery shape.

**Recruiting workflow**: requirement clarification → talent research & search → initial screening → outreach & follow-through → selection & hire. It shows which stretch of the business the product covers.

**Evaluation task types**: Known-item Lookup, Open Sourcing, Talent Mapping, Closed-pool Screening, Outreach. They decide a case's ground truth, grading config and measurement mode.

Here are the **evaluation task types** for a talent-search agent. On the surface they are all still about "finding people," but the evaluation configs are completely different.

| Task type | Business stage | Usable ground truth | Example |
| --- | --- | --- | --- |
| **Known-item Lookup** | Talent research & search | Target profile, aliases, channel IDs | Find the current CTO of a given company. |
| **Open Sourcing** | Search & initial screening | Hard requirements, candidate evidence, recruiter judgment | Build a list of people worth talking to for a Head of AI Infra role. |
| **Talent Mapping** | Talent research & search | Org boundaries, rosters, coverage pool | Map the research leads and senior engineers across companies in a sector. |
| **Closed-pool Screening** | Initial screening | Resumes, explicit include and exclude rules | From 500 resumes, filter to the ones meeting the location and skill bar. |
| **Outreach & Engagement** | Outreach & follow-through | Recipients, contact rules, replies and follow-up events | Write personalized first-touch messages for a shortlist, control repeat contact, track replies. |

Task type is only the first layer of the dataset. The second layer is business scenario: industry, function, seniority, region, and candidate-pool size. An executive role may have a pool under a hundred people — closer to an enumerable mapping problem; a high-volume mid-level role tests search and filtering against a large pool. The third layer is capability tags: multi-hop retrieval, multi-source verification, cross-domain retrieval, needle-in-a-haystack.

So a case is best written not as a prompt but as a coordinate: `task type × business scenario × capability tag`. The dataset is made of these coordinates. When the question set grows, we can see which real scenarios are still missing; when a score moves, we know where it moved.

## 2. Every task type needs its own grading config

The dataset answers "what to evaluate." The grading config answers "how this type of task gets judged." We need to write down the expected result, the acceptable evidence, and the graders. Public agent benchmarks are converging the same way: deterministic checks when evidence suffices, structured model judgment only where semantics can't be enumerated. [Agents' Last Exam](https://arxiv.org/abs/2606.05405), [Claw-Eval-Live](https://arxiv.org/abs/2604.28139) and Anthropic's engineering guide on agent evals all use this division of labor.

| Grading layer | What it judges | Notes |
| --- | --- | --- |
| **L0 assertion** | Whether the expected object or state shows up. | For known-item lookup and enumerable talent maps. Target profile in top-k passes; not found fails. Long tasks can split into vital / okay items, with repeated runs for `pass^k`. |
| **L1 constraints** | Whether non-negotiable business and process constraints hold. | Location, employment status, years of experience, source evidence, channel compliance, repeat contact — all judged by facts and rules. A serious violation should block outright, not shave a few points off a total. |
| **L2 semantics** | Past the hard requirements, whether this delivery is the more suitable one. | Open sourcing usually needs this layer: judging experience, technical depth and transferability item by item, requiring cited evidence, with the model judge calibrated against human gold labels. |
| **L3 outcome** | Whether the delivery produced an effect in the real workflow. | Saves, accepts, contacts, replies, interviews — long-horizon observation of part of the online deliveries. It checks whether offline conclusions track user value. |

These four layers are four judging capabilities the system owns, not a pipeline every case must walk. A known-item lookup may need only L0; closed-pool screening is mostly L1; open sourcing usually needs L1 plus L2; L3 only exists after launch. The point: every case declares which layers it uses, and why.

| Task type | L0 assertion | L1 constraints | L2 semantics | L3 outcome | Meaning |
| --- | --- | --- | --- | --- | --- |
| Lookup | ● | ○ | ○ | ○ | Was the target hit |
| Screening | ○ | ● | ○ | ○ | Were the rules enforced |
| Sourcing | ○ | ● | ● | ○ | Is the result the right one |
| Mapping | ● | ● | ○ | ○ | Is coverage sufficient |
| Outreach | ○ | ● | ○ | ● | Did outreach land |

*● layer in use, ○ not required. Grading layers are composable capabilities, not a pipeline every case must pass through.*

## 3. Design capability probes for the core capabilities

A recruiting agent doesn't run on "reasoning ability" alone. It leans on a few other capabilities: cross-source evidence gathering, multi-hop retrieval, and hybrid retrieval across the closed domain (a given candidate pool) and the open domain (the public web). All of these need deliberately constructed questions; sample randomly from production requests and the set fills up with single-channel, short-path, single-domain easy tasks.

| Capability probe | What's actually hard | How to construct it | Preferred grading |
| --- | --- | --- | --- |
| **Multi-hop retrieval** | Several scattered facts must be chained to lock onto the target candidate — not conditions ticked off one profile. | Pick a real target candidate first, enumerate their cross-source attributes, then write the query backwards. Keep the target verifiable; control difficulty by hop count and how obscure each hop is. | L0: was the target found. Add L1 if needed: was the key evidence covered. |
| **Cross-source aggregation** | No single channel is enough to judge: the candidate may sit in source A while the decisive history or contact info sits in source B. | Build cases that can't be solved from one source; require final evidence from mutually independent sources, and don't count reposts of the same information as multiple sources. | L0: key objects covered; L1: evidence cross-source and traceable. |
| **Cross-domain / hybrid retrieval** | The closed domain demands no misses: the pool is given and enumerable, recall is computable. The open domain has no boundary: coverage is unknown and everything rides on search strategy. Hybrid has to get both right, and match the same person found on either side. | From one JD, build two configurations: closed-pool-only, or a closed pool holding only part of the answer with the rest requiring the open domain. | The closed domain is enumerable, so compute recall with L0 / L1; open and hybrid domains use L2. |
| **Recruiting needle-in-a-haystack** | In a large enough pool, only a few people meet all the conditions, and the distractors are highly similar. | Freeze a replayable pool and plant the unique qualifying target; tune difficulty with pool size and distractor similarity. | L0: was the target recovered; L1: were the filters fully enforced. |

What matters most in a probe is being **hard to solve, easy to verify**: the agent must use the target capability to solve it, and the final result must be checkable with clear assertions. Multi-hop questions slide into multi-constraint questions easily — if every condition can be verified on the same profile, the question is really testing L1 filtering, not a cross-entity, cross-source chain of information.

The other thing to watch is interference from the model's own knowledge. The LLM has already absorbed a huge amount of the world; the target candidate we design shouldn't be someone prominent enough for the model to recite. Keep at least one hop on recent evidence, isolated from training data, caches and the internal candidate store. And when pass rates approach saturation, there's no rush to swap metrics — add a hop, spread the sources wider, or raise distractor similarity. That keeps the probes pressure-testing capability, and keeps them working as the agent improves.

## 4. Absolute and relative: two measurement modes

The same grading config needs to run in two modes. Absolute evaluation asks "did it meet expectations"; relative evaluation asks "is it better than the baseline." Each has its place — mix the two into one score and the results get hard to explain later.

**Absolute evaluation**: was the target candidate found; were the hard requirements met; is there sufficient evidence; did a release break an existing capability. Right for regression gates.

**Relative evaluation**: which retrieval strategy brings back more usable candidates; which orchestration fits the JD better; is the new version better than the baseline. Right for choosing between approaches.

The trouble with open sourcing is that nobody knows every suitable candidate in the world, so "recall" as such can't be evaluated. The honest approach is to pool the candidates from several systems, add human judgment, and report relative pool coverage.

## 5. Key points in practice

The task set, the grading configs and the measurement modes define the skeleton. To make it genuinely usable, three engineering problems remain: whether the graders can be trusted, whether runs are comparable, and how online feedback comes back into the offline system.

1. **Calibrate the graders**: an L2 judge is a grader. Build a human gold set with good cases, bad cases and boundary cases, and compare the judge against experts on a regular basis.
2. **Pin the run environment**: record the dataset, model, harness, tool snapshots and grader versions. Replayable environments do the regression; production traffic watches how the real world moves.
3. **Wire business results back**: join product version and task type to online behavior, and flow back labels like accepted, contacted, feedback. No feedback isn't necessarily a negative; and hires are too infrequent to steer day-to-day tuning.

*Note: offline evaluation owns the fast, controllable feedback; online results answer whether real value got measured.*

This is also why evaluation has to be a system. Without human calibration, L2's scale drifts; without environment and version records, historical scores can't be compared; without online flowback, offline quality never learns whether it stands for user value. Take away any one part and the others barely stand on their own.

## 6. An evaluation system is grown

The first dataset doesn't need to be big. The most reliable source is real tasks and production bad cases: a key person missed, a mismatch, a judgment with no source, a run that should have stopped and didn't. They aren't just bugs — they're the most valuable increments the evaluation system gets.

1. **Online feedback**: save the request, the delivery, the trace, the environment and version.
2. **Classify the task**: confirm which task type and business scenario it belongs to.
3. **Configure grading**: assertables go to L0, hard requirements to L1, semantic disputes to L2.
4. **Into the regression set**: re-run after the fix, and keep watching the online results.

*A good benchmark isn't written in one pass; it settles out of product understanding and real failures.*

Process metrics — understand, plan, execute, verify, stop — should be recorded too, but their main job is diagnosis: why did this sourcing request fail? A misread JD, a retrieval path too narrow, a tool failure, or verification failing to block? These process metrics only help fix the system; they don't replace judgment on the final delivery.

In the end, what an agent evaluation system produces is not just one overall score but a durable ability to judge: we know which tasks got better, why we believe that conclusion, and what in the product to change next.

## References

- Anthropic, [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) — the code / model / human grader split; turning real failed tasks into regression questions.
- [Agents' Last Exam](https://arxiv.org/abs/2606.05405) and [Claw-Eval-Live](https://arxiv.org/abs/2604.28139) — deterministic checks first where evidence suffices; live signals kept apart from frozen snapshots.
- Yao et al., [τ-bench](https://arxiv.org/abs/2406.12045) — terminal-state assertions, `pass^k`, process integrity.
- Exa, [People Search Benchmark](https://exa.ai/blog/people-search-benchmark) — different yardsticks for known-item lookup and open role discovery.
- Zhu et al., [Agentic Benchmark Checklist](https://arxiv.org/abs/2507.02825) — task validity, outcome validity, reporting discipline.

A research note on agent evaluation systems. The concrete task definitions, grading standards and business ground truth still need to evolve with the product and its users' workflows.
