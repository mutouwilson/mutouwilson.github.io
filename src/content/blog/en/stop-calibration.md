---
title: 'Stopping: the next place agents compete'
description: 'Once completion rates all reach 90%, what separates agents is where they stop. Stopping is the only decision an agent cannot avoid, and the only irreversible one.'
pubDate: 2026-07-28
tags: ['Agent engineering', 'stop calibration']
---

As models get smarter and harness engineering spreads, most agents on the market have come a long way on task completion — 90%+ on the completion metric is normal now. But completing a delivery (a result came out) and completing a good delivery (a result that meets what the user expected, or beats it) are two different levels. The first got the output out of the door. The second is the user looking at it, deciding it holds up, and handing you the next task too. The second is the one worth building for.

## Stopping is the only decision an agent cannot avoid

Put plainly, every agent today is roughly the same shape: a model, a harness around it, running in a loop. Open up one round of the trace and it is the model reading the current context, doing one thing (calling a tool) or saying something, then pushing the result back into the context and going round again.

When we design an agent we usually think about planning, tool selection, environment design, context management. But there is a more basic decision hiding at the end of every round. When the round closes, the agent has in fact picked one of three actions:

<figure>
<ol class="tiers">
<li><p class="tier-name"><span>continue</span>go round again</p><p class="tier-fact">reversible</p></li>
<li><p class="tier-name"><span>ask</span>hand the turn back without claiming completion: clarify, get a decision</p><p class="tier-fact">reversible</p></li>
<li><p class="tier-name"><span>commit</span>claim completion, deliver</p><p class="tier-fact">irreversible</p></li>
</ol>
<figcaption>A trace can skip planning, tools and sub-agents. It stops exactly once.</figcaption>
</figure>

Two things make this decision unusual.

First, it is the only one you cannot dodge. Planning is optional — simple tasks do not need it. Tools are optional — the model's own knowledge can carry an answer. Sub-agents and sandboxes are optional. A trace can skip any of that, but it will stop exactly once. Which means something easy to miss: every agent already has a stopping policy, even if nobody ever designed it. And the one nobody designed came out of training. RLHF does not optimise for "the task is genuinely done", it optimises a proxy reward trained on human preference — and under that reward the easiest stopping rule for a model to learn is "it looks done, so stop."

Second, it is the only irreversible one. A bad plan can be revised, a bad tool call retried, a wrong direction turned around; as long as the loop is still running there is still time. Commit is different: the search space you skipped, the verification you did not run, the requirement you misread all go out with it, and that is the end of it.

An attempt at putting delivery quality into one line:

> **delivery quality ≈ capability ceiling × realisation rate**

Capability decides how good this agent could possibly be; where it stops decides how much of that ceiling gets realised. Stop early and a high ceiling still only delivers six tenths of itself. Fail to stop and every extra round burns tokens and time. Getting the stop to land in the right place — not knocking off early, not spinning for nothing — is what I call stop calibration.

"Can complete" is productising fast right now, and capability ceilings across agents are converging. What separates them in the next phase is most likely the second factor. And stop calibration is something almost nobody designs explicitly today.

## What goes wrong with stopping policies

A table first. Enumerate it and the failure set is fairly clear.

| Should have picked        | Actually picked | Failure                                              | Share    |
| ------------------------- | --------------- | ---------------------------------------------------- | -------- |
| continue                  | commit          | **stopping early**: delivered unfinished             | 7.82%    |
| commit                    | continue        | **overrunning**: finished and still going            | 9.82%    |
| ask                       | continue        | **not asking**: ran the whole way on a misreading    | 11.65%   |
| continue                  | ask             | **asking needlessly**: making the user its loop condition | no consistent figure |
| continue (but zero output) | continue       | **spinning**: the policy never noticed continuing produces nothing | 17.14% |

The shares come from MAST (Multi-Agent System Failure Taxonomy, ICML 2025), the first large-scale empirical study of agent failure modes, out of Berkeley in 2025: 1,642 real execution traces from 7 mainstream frameworks including ChatDev, MetaGPT and AppWorld, annotated one by one — experts built the taxonomy on 150 traces first, then a human-validated automatic pipeline extended it to the full set, ending with 14 failure modes. The table above is my re-grouping of those through the lens of the stopping decision.

### Stopping early: delivered, but not finished

"Premature termination" is a formally defined failure mode in MAST: the goal is not met, the information that should have been gathered was not, and the task ends anyway. Later work gave the behaviour a more precise name, premature disengagement — the agent stops on its own inference rather than on environment feedback like a failing test or incomplete data. "I reckon that's about right."

The harness's loop semantics amplify this. From the Vercel AI SDK implementation:

```ts
do {
  step = await generateStep(messages);
} while (
  step.toolCalls.length > 0 && // this step made a tool call
  !(await isStopConditionMet()) // and no stopWhen condition fired
);
```

Note the first condition. `stopWhen` is only evaluated if the model made a tool call; if the model simply emits plain text, the loop ends unconditionally and whatever stop conditions you configured are never even consulted. Most other frameworks are similar — the model producing a "final answer" counts as the end. Which is to say: the model declares completion and the harness takes its word for it.

So how trustworthy is that declaration? Someone measured it. On SWE-bench Pro, the worst of the frontier models tested had a real success rate of 22% against a self-estimate of 77%. Hand the stopping decision entirely to the model and stopping early is close to inevitable.

### Overrunning: finished, and still going

The other direction fails just as readily, and usually it is what you get while fixing the first one.

Tencent AI Lab has a paper with a very direct title: _Do NOT Think That Much for 2+3=?_ Ask a reasoning model what 2+3 is and QwQ produces 13 solutions and 901 tokens, of which only the 39 tokens of the first one do any work. On small questions that wastes money; on hard ones it is worse, because the score drops. Thinking length has an optimum, and piling on compute past it buys a worse answer. On GSM8K, pushing thinking tokens from 1,100 to 15,980 took accuracy from 87.3% down to 70.3%.

The matching MAST mode is "**unaware of termination conditions**" — should stop, does not — at 9.82%, slightly above stopping early. Anthropic said the same thing reviewing their multi-agent research system: early versions systematically over-invested on simple queries, and what finally fixed it was writing the budget into the prompt — 1 agent and 3–10 tool calls for a simple fact lookup, more than 10 sub-agents only for genuine research.

### Spinning: neither finished nor working

The third kind is the most concealed. The agent is still running, tokens are still burning, and there is no marginal progress at all: the same search reworded and run again, the same failing command retried for the fifth time.

The largest single failure mode in the MAST data is not stopping early and not overrunning. It is "**step repetition**", at 17.14%, higher than any other. One paper describes the behaviour as the agent being unaware that the goal is too hard or that it is already stuck, repeating the same mistakes in an unproductive loop; after they fitted the loop with an exit mechanism, redundant steps dropped by 50–70%.

The problem did get widely recognised later, but nobody has a good answer to it — what got added were backstops. The AutoGen docs say plainly that without a termination condition a conversation will "run indefinitely". LangGraph simply gave graph execution a default ceiling of `recursion_limit = 25` and throws `GraphRecursionError` past it. Those defaults exist because of spinning.

### HITL misfiring: not asking when it should, asking when it should not

"Not asking" is 11.65%, more frequent than stopping early. Faced with ambiguous or incomplete information the agent does not ask for clarification; it runs all the way on its own reading. The experience on the user's side is familiar: the agent is working hard, a flurry of impressive operations, and none of it is the thing you wanted. This is a stopping failure too — at the step where it should have handed control back to confirm direction, it chose continue.

The mirror image is asking needlessly, throwing something it could perfectly well decide back at the user: "I plan to do A first, please confirm and I'll continue." OpenAI wrote a line into the GPT-5.1 prompting guide specifically for this: "It's very bad to leave the user hanging." Asking too early transfers the cost of execution onto the user; asking too late bets the whole trace on an unconfirmed assumption.

### Four failures, one root cause

Put the four side by side and it is clear they are not four independent bugs. Every one of the decisions hangs off the model's self-assessment, and that self-assessment has no external signal calibrating it. Overestimate "am I done" and you stop early. Fail to answer "am I still making progress" and you spin or overrun. Overestimate "did I understand this right" and you do not ask. Underestimate "can I decide this myself" and you ask needlessly.

This also explains a familiar class of engineering trap: a patch in one direction always brings on the opposite problem. Write "be thorough, do not finish early" into the prompt and stopping early falls while overrunning arrives. Write "ask the user when unsure" and drift falls while clarification requests start piling up. Impose a hard step ceiling and spinning stops, but complex long-horizon tasks get cut off mid-way. These patches change the distribution of failures, not the total. Which is the point: what is needed is calibration, not bias.

## Stopping is not an agent-specific problem

"The executor's own declaration that the work is done cannot be trusted" — a quick look around finds medicine, aviation and manufacturing have all hit this, other industries surely too, and the shape of everyone's answer is remarkably consistent.

| Field       | The executor's self-assessment fails           | The criterion moved outside                    | Result                                       |
| ----------- | ---------------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| Medicine    | premature closure: a plausible diagnosis ends the search | three mandatory stop points on the WHO surgical checklist | mortality 1.5% → 0.8% (7,688 patients)   |
| Medicine    | nobody stops a doctor skipping a step          | nurses formally authorised to halt              | line infections 2.7 per 1,000 catheter-days → 0 |
| Aviation    | the pilot's discretion on continuing an approach | nine criteria at 1,000 feet, miss one and go around | unstable approaches: causal in 66% of approach-and-landing accidents |
| Toyota      | workers not daring to report a defect          | andon cord plus a team leader responding within takt | pull rate measured as a health metric     |

**Medicine**: a 2005 analysis of 100 internal-medicine misdiagnoses found the most frequent cognitive error was premature closure — a plausible diagnosis arrives and consideration of the alternatives stops. Croskerry, a professor of emergency medicine, has the line: "When the diagnosis is made, the thinking stops." The answer was not to ask doctors to be more careful, it was to move the criterion outside: the WHO surgical safety checklist sets three mandatory stop points, before anaesthesia, before incision and before leaving the room, each confirmed item by item — in a controlled study of 7,688 patients across 8 countries, mortality fell from 1.5% to 0.8%. Pronovost's central line checklist went further: infections fell from 2.7 per 1,000 catheter-days to zero, and what did it was not the checklist but the hospital formally authorising nurses to stop a doctor they saw skipping a step. The authority to stop was taken out of the executor's hands and given to an independent party.

**Aviation**: there is a fixed gate before landing. Nine criteria must all hold at 1,000 feet; miss any one and a go-around is mandatory, with no discretion. Unstable approaches are a causal factor in 66% of approach-and-landing accidents (FSF ALAR).

**Toyota**: the andon cord. Any worker on the line who spots an anomaly pulls it, a team leader responds within takt time, and if it is resolved the line never stops. The number that circulates in lean circles is about five thousand pulls a day at the Kentucky plant, against a US automaker at two a week. Toyota's reading is counter-intuitive: too few pulls is not good quality, it is workers not daring to pull, so they measure the stop rate as a health metric. Mapped onto agents, pulling the cord is `ask`. An agent that never requests clarification and whose verification never blocks anything does not have no problems — it has a cord nobody dares pull.

Together they show one pattern: **the executor's self-assessment cannot be trusted**. Software has been using the same mechanism all along — Scrum's Definition of Done, SRE error budgets, the second signature on a code review.

## Engineering practice

There is a candid passage in the Claude Code docs: "Claude stops when the work looks done. Without a check it can run, 'looks done' is the only signal available, and you become the verification loop." With no runnable check, "looks done" is the only signal there is, and you personally are the verification loop. So can the you in that sentence be replaced by a mechanism? It can.

The mechanisms fall into two groups.

### Model-side

Research is running in roughly four directions:

- Test-time intervention: s1's budget forcing suppresses the end-of-thinking token when the model wants to wrap up and appends a "Wait", taking AIME24 from 50% to 57%.
- Decoding: for underthinking — switching approach too often — penalise the thought-switching token, worth 2–4 points on hard problems.
- Training: process reward models over tool trajectories, scoring step by step rather than only the outcome.
- Most thoroughly, the OpenAI Deep Research approach: end-to-end RL that trains backtracking and persistence into the weights.

### Engineering: a set of guardrails for each of the three actions

commit needs verification:

- Executable verification first: for code, run the tests and the compiler; for structured data, validate the schema; for citations, check reachability. This tier is the strongest because it bypasses model self-assessment entirely.
- Turn completion criteria into predicates: generate structured acceptance criteria when the task starts and attach evidence item by item on delivery. A wrap-up warning near the budget should carry the criteria with it ("unmet items go into limitations") rather than simply truncating.
- Add an independent verifier on high-value tasks: a fresh context given only the original request, the deliverable and the criteria — not the generation process — asked to find gaps. Two things to watch: report only gaps that affect correctness or an explicit requirement, or it turns into over-engineering; and cap the interception, the way Claude Code's Stop hook force-releases after 8 consecutive blocks, so the verification loop does not become an infinite loop itself.
- Make the completion report explicit: the commit output structure has to state what was done, what was not, and what was not verified. Partial completion is fine, but it has to be declared. Silent partial completion is not.

continue needs to adapt:

- Switch model by task type: a different model or a different effort level — higher tier for complex tasks, cheap model for simple ones.
- Stalling is not convergence: several rounds with no new output should default to changing strategy, not to stopping and not to spinning. It is not complicated to implement — dedupe detection on tool calls, and inject "try another way" on a hit.
- Checkpoint long tasks: reliability decays with task length (measured: pass@1 falls from 76.3% on short tasks to 52.1% on very long ones), so rather than pushing on inside a contaminated context, save the verified progress and continue in a fresh one.

ask needs calibration:

- Use a disagreement signal instead of confidence: to decide whether to ask, do not ask the model "are you sure", measure objective disagreement. KnowNo (Google DeepMind and Princeton, CoRL 2023 best student paper) uses conformal prediction to collapse candidate actions into a prediction set: one member left and it acts autonomously, more than one and it asks, with a statistical guarantee.
- Do not ask what needs no asking: decide what you can decide, assume reasonably, keep going, and write the assumptions into the completion report.
- Feed ask data back: look at the share of questions where the user gave a non-default answer. Too low and it is pestering the user; too high alongside rework and it is not asking about the things it should.

### Traps worth avoiding

1. Having the model reflect before answering does not do much. DeepMind measured it: pure self-correction with no external signal lowers accuracy rather than raising it. We tried putting "reflect three times before delivering" in a system prompt ourselves, and it changed nothing.
2. The model's own confidence is not a usable stopping signal. The overconfidence study above tested this: mid-execution self-doubt occurs at the same rate in successful and failed trajectories.
3. The easy mistake with a judge: **handing it the full context and asking whether the work is complete**. If you use a judge it has to be a fresh context, plus criteria, plus an adversarial framing. Give a judge the whole context untouched and a long answer with no new information will probably score higher.
4. Repeatedly asking "are you sure". Anthropic measured this: challenged that way, models will sometimes change a correct answer to a wrong one. We wanted a re-check and got compliance.

It comes down to one thing: **the calibration signal has to come from outside the executor**.

### The criteria come from understanding the business

All of the above is implementable. But mechanism answers who verifies and where; the definition of what counts as done can only come from understanding the business.

Compare two kinds of task. For code the criteria cost almost nothing: tests pass means done, and verification is carried by the compiler and the test framework. Research-type tasks have no equivalent. How many sources counts as sufficient coverage, how many query angles counts as exhaustive, under what conditions a zero-result is a legitimate answer, whether the agent may decide a trade-off in scope on its own — every one of those criteria rests on domain experience, and no framework can answer them for you.

The highest-value part of the whole stopping design is making explicit, item by item, what counts as done in this business, what counts as wasted effort, and what has to be handed to the user. That work currently requires a person.

## Does a smarter model make stop design obsolete?

Fable 5 and GPT-5.6 have both shipped and smarter models are coming, so the question is unavoidable: with models this capable, is stop design still necessary?

_Agentic Uncertainty Reveals Agentic Overconfidence_ tested exactly this generation of frontier models (February 2026: GPT-5.2-Codex, Gemini-3-Pro, Claude Opus 4.5). Over two years capability went up and knowing whether it is done did not follow. The reason is already in the body above: this is an alignment problem, not a capability problem. Self-assessment and execution share one set of weights, and what training optimises is the "looks done" proxy — the stronger the model, the more convincing "looks done" also gets. The two rise together.

And delivery quality is a product, so the higher the ceiling, the larger the absolute loss from each point of realisation rate given up. The frontier labs are voting with their feet: the ones selling the strongest models are shipping the heaviest stopping mechanisms alongside them — Stop hook, `/goal`, output guardrails, RubricMiddleware. A May 2026 survey, _Reinforcement Learning for LLM-based Multi-Agent Systems through Orchestration Traces_, looks at five sub-decisions in multi-agent orchestration and states plainly that "when to stop" is the only one with no RL training method at all so far.

What smarter models probably do change: soft constraints work better on strong models (after GPT-5.2, OpenAI's guidance moved from hard tool ceilings to semantic stopping criteria), and verification tiers can be relaxed. Meanwhile stop design turns out to be one of the few real differentiators left once agent capability converges — mechanisms will become common, criteria settled into a business will not.

One last line: capability decides how good an agent can be, stop design decides how good it actually delivers.

## References

### Papers

- Cemri et al., _Why Do Multi-Agent LLM Systems Fail?_ (MAST), ICML 2025 — [arXiv:2503.13657](https://arxiv.org/abs/2503.13657). Source for the failure share table and the definitions and frequencies of premature termination / unaware of termination conditions / step repetition / not asking.
- Cuadron et al., _The Danger of Overthinking: Examining the Reasoning-Action Dilemma in Agentic Tasks_ — [arXiv:2502.08235](https://arxiv.org/abs/2502.08235). Premature disengagement: stopping on internal inference rather than environment feedback.
- Kaddour et al., _Agentic Uncertainty Reveals Agentic Overconfidence_ — [arXiv:2602.06948](https://arxiv.org/abs/2602.06948). 22% real success against a 77% self-estimate on SWE-bench Pro; mid-execution self-doubt carries no information (trap #2).
- Chen et al. (Tencent AI Lab), _Do NOT Think That Much for 2+3=? On the Overthinking of o1-Like LLMs_ — [arXiv:2412.21187](https://arxiv.org/abs/2412.21187). 13 solutions and 901 tokens for 2+3.
- Ghosal et al., _Does Thinking More always Help? Mirage of Test-Time Scaling in Reasoning Models_, NeurIPS 2025 — [arXiv:2506.04210](https://arxiv.org/abs/2506.04210). GSM8K thinking tokens 1,100→15,980, accuracy 87.3%→70.3%.
- Lu et al., _Runaway is Ashamed, But Helpful: On the Early-Exit Behavior of LLM-based Agents in Embodied Environments_, EMNLP 2025 Findings — [arXiv:2505.17616](https://arxiv.org/abs/2505.17616). Characterises stuck loops; an exit mechanism cut redundant steps by 50–70%.
- Muennighoff et al., _s1: Simple test-time scaling_ — [arXiv:2501.19393](https://arxiv.org/abs/2501.19393). Budget forcing, AIME24 50%→57%.
- Wang, Liu et al., _Thoughts Are All Over the Place: On the Underthinking of o1-Like LLMs_, NeurIPS 2025 — [arXiv:2501.18585](https://arxiv.org/abs/2501.18585). Thought-switching penalty (TIP), +2–4 points on hard problems.
- Lightman et al., _Let's Verify Step by Step_ — [arXiv:2305.20050](https://arxiv.org/abs/2305.20050). Origin of process supervision (PRM); for process rewards over tool trajectories see ToolPRMBench — [arXiv:2601.12294](https://arxiv.org/abs/2601.12294).
- _Beyond pass@1: A Reliability Science Framework for Long-Horizon LLM Agents_ — [arXiv:2603.29231](https://arxiv.org/abs/2603.29231). pass@1 decaying from 76.3% on short tasks to 52.1% on very long ones.
- Ren et al., _Robots That Ask For Help: Uncertainty Alignment for Large Language Model Planners_ (KnowNo), CoRL 2023 best student paper — [arXiv:2307.01928](https://arxiv.org/abs/2307.01928). Conformal prediction calibrating when to ask.
- Huang et al., _Large Language Models Cannot Self-Correct Reasoning Yet_, ICLR 2024 — [arXiv:2310.01798](https://arxiv.org/abs/2310.01798). Self-correction without an external signal lowers accuracy (trap #1).
- Zheng et al., _Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena_, NeurIPS 2023 — [arXiv:2306.05685](https://arxiv.org/abs/2306.05685). Systematic judge biases including a preference for long answers (trap #3).
- Sharma et al. (Anthropic), _Towards Understanding Sycophancy in Language Models_ — [arXiv:2310.13548](https://arxiv.org/abs/2310.13548). Changing a correct answer under pushback (trap #4).
- _SYCON Bench_ — [arXiv:2505.23840](https://arxiv.org/abs/2505.23840). Measuring compliance under multi-turn pressure; reasoning tuning cuts it by up to 21.6% (discussion section).
- Zhang, _Reinforcement Learning for LLM-based Multi-Agent Systems through Orchestration Traces_ — [arXiv:2605.02801](https://arxiv.org/abs/2605.02801). Of five sub-decisions in multi-agent orchestration, "when to stop" has no RL training method yet (discussion section).

### Frameworks and documentation

- Anthropic, _How we built our multi-agent research system_, 2025-06 — [anthropic.com](https://www.anthropic.com/engineering/multi-agent-research-system). Tiered effort budgets (1 agent / 3–10 calls and so on).
- OpenAI, _Introducing deep research_ — [openai.com](https://openai.com/index/introducing-deep-research/). End-to-end RL training browsing and persistence.
- OpenAI, _GPT-5 prompting guide_ (GPT-5.1 update) — [developers.openai.com](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide). "It's very bad to leave the user hanging."
- Vercel AI SDK docs, _Tool Calling / Building Agents_ — [ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling). Stop conditions "only evaluated when the last step contains tool results"; a plain-text step terminates.
- AutoGen _Termination Conditions_ — [microsoft.github.io/autogen](https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.conditions.html) (without a termination condition it will "run indefinitely"); LangGraph `recursion_limit` — [docs.langchain.com](https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT).
- Claude Code docs, _Best practices_ (the "looks done" quote) and _Hooks guide_ (the Stop hook's 8-block cap) — [code.claude.com](https://code.claude.com/docs/en/best-practices).
- LangChain, _Introducing Rubrics for deepagents_ (RubricMiddleware, 2026-06) — [langchain.com](https://www.langchain.com/blog/introducing-rubrics-for-deepagents). A runtime completeness gate: no final verdict, no finishing (discussion section).
