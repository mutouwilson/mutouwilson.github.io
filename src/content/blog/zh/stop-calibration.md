---
title: 停止，Agent 下一个竞争力核心
description: 完成率都到 90% 之后，拉开差距的是停在哪一刻。停止是 agent 唯一躲不掉、也唯一不可逆的决策。
pubDate: 2026-07-28
tags: ['Agent 工程', '停止校准']
---

随着模型智能的提升，以及 Harness 工程的逐渐普及，市场上的大部分 Agent 在任务完成率上都取得了长足的进展，在完成率指标上都可以达到 90%+；但是我们需要注意到，完成交付（交付出了结果）和完成高质量交付（交付出了符合用户预期甚至超预期的结果）是完全不同的两个层级。前者是把结果吐出来了，后者是用户拿到手觉得靠谱、敢把下一个任务也交给你。值得做的是后者。

## 停止是 Agent 唯一逃不掉的决策

直白通俗的说，现在的 agent 拆开看基本都是一个模式：一个大模型，外面套一层 harness，循环跑。展开每一轮的 trace 来看，就是模型读一遍当前上下文，做一件事（调个工具），或者说段话，再然后把结果塞回上下文，进下一轮。

在设计 agent 的时候，我们通常考虑的是：怎么规划、怎么选工具、怎么设计环境、怎么管上下文。但每一轮的结尾都藏着一个更基础的决策。这一轮结束时，agent 实际上在三个动作里选了一个：

<figure>
<ol class="tiers">
<li><p class="tier-name"><span>continue</span>继续下一轮</p><p class="tier-fact">可逆</p></li>
<li><p class="tier-name"><span>ask</span>把回合交还给用户，但不宣称完成：问澄清、要决策</p><p class="tier-fact">可逆</p></li>
<li><p class="tier-name"><span>commit</span>宣称完成，交付结果</p><p class="tier-fact">不可逆</p></li>
</ol>
<figcaption>一条 trace 可以跳过规划、工具、子 agent，但一定恰好会停一次。</figcaption>
</figure>

这个决策有两个特别的地方。

第一，它是唯一躲不开的。Plan 可以不做，简单任务不需要；工具也可以不用，模型内知识直接可以支撑回答；子 agent、沙箱环境都是可选项。一条 trace 可以跳过上面任何一环，但一定恰好会停一次。这意味着一件容易被忽略的事：每个 agent 其实都已经有一个停止策略了，哪怕我们从来没设计过它。而没设计过的这个停止策略，是从训练里带出来的，RLHF 优化的不是"任务真的完成了"，是一个拿人类偏好训出来的 proxy reward，但是在这种奖励下面，模型最容易学会的停止规则其实就是："看起来做完了，就停。"

第二，它是唯一不可逆的。Plan 错了能改，工具调错了能重试，方向偏了能掉头，循环没停，一切都还来得及。commit 了就不一样了：漏掉的搜索空间、跳过的验证、理解错的需求，全都跟着一起交出去，然后就没有然后了。

尝试把交付质量拆成这么一个式子：

> **交付质量 ≈ 能力上限 × 兑现率**

能力决定这个 agent 最好能做到多好，停在哪一刻决定这个上限兑现了多少。停早了，上限再高也就交付个六成；停不下来，多跑的每一轮都在烧 token 和时间。让停止落在对的地方，不提前收工，也不无谓空转——这件事我称为停止校准。

当前市面上，"能完成"这个事正在快速产品化，各家 agent 的能力上限也越来越接近，但是下一阶段拉开差距的大概率是第二个因子。而停止校准这件事，今天绝大多数 agent 里没人去显式设计过。

## 停止策略存在的问题

先上一张表，我们穷举下，大致就知道有哪些问题。

| 该选的动作             | 实际选的 | 故障类型                                   | 占比       |
| ---------------------- | -------- | ------------------------------------------ | ---------- |
| continue               | commit   | **早停**：没做完就交付                     | 7.82%      |
| commit                 | continue | **执行过度**：做完了还在做                 | 9.82%      |
| ask                    | continue | **该问不问**：抱着错误理解跑完全程         | 11.65%     |
| continue               | ask      | **不该问而问**：把用户变成自己的循环条件   | 无统一统计 |
| continue（但产出为零） | continue | **空转**：策略没发现继续已经不产生任何东西 | 17.14%     |

占比数据引用自 2025 年伯克利发的第一份大规模 agent 失败模式实证研究 MAST（Multi-Agent System Failure Taxonomy，ICML 2025）：收了 ChatDev、MetaGPT、AppWorld 等 7 个主流框架的 1,642 条真实执行轨迹逐条标注——先由专家在 150 条上建立分类，再用人工校验过的自动管线扩到全量，最后归纳出 14 种失败模式。上表是我按"停止决策"这个视角对它们重新归的类。

### 早停：交付了，但没做完

"过早终止"（premature termination）在 MAST 里是个被正式定义的失败模式：目标没达成、该拿的信息没拿全，任务就结束了。后来有研究给这种行为起了个更准的名字，叫 premature disengagement，简单来说就是 agent 停止的依据不是测试没过、数据不全这种环境反馈，而是它自己的推断："我觉得差不多了"。

这个倾向会被 harness 的循环语义放大。从 Vercel AI SDK 的实现来佐证下：

```ts
do {
  step = await generateStep(messages);
} while (
  step.toolCalls.length > 0 && // 本步发起了工具调用
  !(await isStopConditionMet()) // 且未命中任何 stopWhen 条件
);
```

注意第一个条件。只有模型发起了工具调用，stopWhen 才会被评估；模型直接输出一段纯文本，循环无条件结束，我们配的任何停止条件根本不会被问到。其他大多数框架也类似，模型给出"最终回答"就算结束。等于说，模型宣布完成，harness 默认采信。

那模型的"宣布"到底有多可信呢？有人测过：SWE-bench Pro 上，被测的前沿模型里最离谱的一个，实际成功率 22%，自估 77%。把停止决策权完全交给模型自己，早停基本是必然的。

### 执行过度：做完了，还在做

反过来也一样会出问题，而且往往就是治早停的时候治出来的。

腾讯 AI Lab 有篇论文标题起得很直接：《Do NOT Think That Much for 2+3=?》。问推理模型 2+3 等于几，QwQ 给了 13 种解法、901 个 token，其中只有第一个解的 39 个 token 是有用的。小问题上这是浪费钱，难问题上更糟，会掉分——思考长度有个最优点，过了这个点继续堆算力，是花钱买更差的答案。GSM8K 上把思考 token 从 1,100 拉到 15,980，准确率从 87.3% 掉到 70.3%。

MAST 里对应的模式叫"**Unaware of termination conditions**"，该停不停，占 9.82%，比早停还高一点。Anthropic 在复盘他们多智能体研究系统的时候也说过这事：早期版本在简单查询上系统性地过度投入，最后是在 prompt 里把预算写死才治住的，简单事实查询 1 个 agent、3–10 次工具调用，复杂研究才配超过 10 个子 agent。

### 空转：既没做完，也没在做

第三类最隐蔽。agent 还在跑，token 还在烧，但已经没有任何边际进展了：同一个搜索换个措辞再来一遍，同一条报错的命令第五次重试。

MAST 数据里最大的单一失败模式不是早停，也不是执行过度，是"**Step repetition**"，17.14%，比哪个都高。有篇论文描述这个行为说，agent"意识不到目标太难或者自己已经卡住，在无产出的循环里重复同样的错误"，他们给循环装了退出机制之后，冗余步骤削掉了 50–70%。

其实这个问题是后来被大家普遍被意识到了，但是大家都没有太好的解法，只是加了一些兜底护栏。AutoGen 文档明说，不配终止条件，对话会 "run indefinitely"；LangGraph 干脆给图执行设了 `recursion_limit = 25` 的默认上限，超了直接抛 `GraphRecursionError`。这些默认护栏本身就是为空转准备的。

### HITL 失灵：该问的不问，不该问的反而问

"该问不问"占 11.65%，比早停还高频。面对模糊或者不完整的信息，agent 不去要澄清，抱着自己的理解一路跑到底。用户端的体感大家就很熟悉了：agent 很努力，一堆操作猛如虎，但做的不是我要的东西。这本质上也是停止失败——在该交回控制权确认方向的那一步，它选了继续。

反面就是"不该问而问"，把自己完全能定的事甩回给用户："我准备先做 A，请确认后我再继续。"OpenAI 在 GPT-5.1 的 prompting 指南里专门为这个写了一条："It's very bad to leave the user hanging." 问早了，是把执行成本转嫁给用户；问晚了，是拿一个没确认过的假设赌整条 trace。

### 四类故障，暴露了同一个根因

把四类摆一起看就清楚了，它们不是四个独立的 bug。决策都挂在模型的自我评估上，而自我评估没有外部信号校准："我做完了吗"估高了，是早停；"我还有进展吗"答不出来，是空转和过度执行；"我理解对了吗"估高了，是该问不问；"我能自己定吗"估低了，是不该问而问。

这也解释了工程上常见的一类踩坑：单方向的补丁总是会带来另外一个问题。Prompt 里写"务必彻底、不要提前结束"，早停降了，过度执行来了；写"拿不准就问用户"，跑偏少了，"ask 澄清"就开始频繁出现；上硬步数上限，空转是止住了，但是复杂的长程任务被拦腰截断。这些补丁只会改变故障的分布，改不了总量。所以我们的观点是：我们需要的是校准，而不是偏置。

## 停止的问题并不是 Agent 所特有的

"执行者自己宣布完工，不可信"——这个命题简单调研了下，医学、航空、制造业全都撞上过，估计其他行业也少不了，而且大家的解法结构出奇地一致。

| 领域 | 执行者自评的失败                     | 外置的判据                             | 效果                            |
| ---- | ------------------------------------ | -------------------------------------- | ------------------------------- |
| 医学 | 过早闭合：有了说得通的诊断就停止考虑 | WHO 手术安全清单三个强制停止点         | 死亡率 1.5% → 0.8%（7,688 例）  |
| 医学 | 医生跳步无人拦                       | 正式授权护士叫停                       | 导管感染 2.7 例/千导管日 → 0    |
| 航空 | 飞行员裁量是否继续进近               | 1,000 英尺九项判据，缺一项强制复飞     | 不稳定进近占进近着陆事故的 66%  |
| 丰田 | 工人不敢报异常                       | 安灯绳 + 班组长节拍内响应              | 拉绳率被当健康指标测量          |

**医学**：2005 年一项对 100 例内科误诊的分析发现，最高频的认知错误是"过早闭合"：有了一个说得通的诊断，就停止考虑其他可能。急诊医学教授 Croskerry 的格言是："When the diagnosis is made, the thinking stops." 解法不是要求医生"更仔细"，而是把判据外置：WHO 手术安全清单在麻醉前、切皮前、离室前设三个强制停止点，逐条确认——8 国 7,688 名患者的对照研究里，死亡率从 1.5% 降到 0.8%。更激进的是 Pronovost 的中心静脉导管清单：感染率从千导管日 2.7 例降到 0，靠的不是清单本身，而是医院正式授权护士，看到医生跳步就叫停。停止权被从执行者手里拿走，交给了独立方。

**航空**：着陆前有一道固定闸门，1,000 英尺高度上九项判据必须全部成立，任何一项不满足，强制复飞，没有裁量空间——不稳定进近是 66% 进近着陆事故的因果因素（FSF ALAR）。

**丰田**：安灯绳。产线上任何工人发现异常就拉绳，班组长在节拍时间内响应，解决掉就不停线。精益圈流传的数字是，肯塔基工厂一天拉绳约五千次，对照某美国车厂——一周两次。丰田的判读反直觉：拉绳太少不是质量好，是工人不敢拉，他们把停止率当健康指标来测量。对应到 agent，拉绳就是 ask。一个从不请求澄清、验证从不拦截的 agent，不是没有问题，是绳没人敢拉。

共同说明了一个模式：**不能信任执行者的自我评估**。其实软件业自己早就在用同款机制，比如 Scrum 的 Definition of Done、SRE 的 error budget、code review 的第二签名。

## 工程上的实践

在 Claude Code 的官方文档里有一段写得很坦白："Claude stops when the work looks done. Without a check it can run, 'looks done' is the only signal available, and you become the verification loop."——没有可运行的检查时，"看起来完成"就是唯一的信号，你本人就是那个验证循环。那能不能把这句话里的 you 换成一个机制呢？答案是：能。

机制大致分两类。

### 模型机制

业界研究目前大致有四个方向：

- 测试时干预：s1 的 budget forcing，在模型想结束思考时压住结束符、补一个 "Wait"，AIME24 从 50% 提到 57%。
- 解码层：针对"频繁换思路"的 underthinking，给思路切换 token 加惩罚，硬题准确率能提 2–4 个点。
- 训练侧：面向工具轨迹的过程奖励模型，逐步给分，而不是只看结果。
- 更彻底的是 OpenAI Deep Research 那种做法，端到端 RL 直接把回溯和坚持练进权重。

### 工程机制：给三个动作各装一套护栏

commit 要验证：

- 可执行的验证优先：针对代码就跑测试和编译，对结构化数据就验证 schema，引用就查可达性。这一档最强，因为完全绕开了模型自评。
- 完成的判据谓词化：任务开始时生成结构化的验收判据，交付时逐条附证据；临近预算的收尾提醒要带着判据（"未满足项列入 limitations"），而不是直接截断。
- 高价值任务加一个独立验证者：创建全新的上下文，只给原始请求、交付物、判据，不给生成过程，用"找缺口"的方式提问。需要注意两个点：只报影响正确性和明确需求的缺口，不然会过度工程；拦截要设置上限，比如 Claude Code 的 Stop hook 连拦 8 次就强制放行，防止验证闭环自己变成死循环。
- 完成报告显示呈现：commit 的输出结构里强制要求输出：做了什么、没做什么、什么没验证。部分完成可以，但必须声明，静默的部分完成不行。

continue 要动态调整：

- 按任务类型切换模型：用不同的模型或不同的 effort，针对复杂的任务使用更高级别的模型或者 effort，简单任务则使用低成本模型。
- 停滞不等于收敛：连续几轮没有新产出，默认动作应该是换策略，而不是停止，也不是傻转。工程实现上也不复杂：我们做个工具调用去重检测，命中就注入一句"换个方法"。
- 长任务用检查点：可靠性随任务长度衰减（有测过，pass@1 从短任务的 76.3% 掉到超长任务的 52.1%），与其在污染的上下文里硬撑，不如存档已验证的进度、开新上下文接着跑。

ask 要校准：

- 用分歧信号代替自信：要不要进行 ask，不要问模型"你确定吗"，要去测客观分歧。KnowNo（Google DeepMind + 普林斯顿，CoRL 2023 最佳学生论文）用 conformal prediction 把候选动作收成预测集，集合里只剩一个就自主执行，大于一个才问人，带统计保证。
- 不需要问的别问：能自主决定的事就自己定，合理假设，继续执行，完成报告里把假设写出来。
- ask 的数据要进行回流：分析被问的问题里用户给出"非默认答案"的比例，如果太低，说明在骚扰用户；如果太高又伴随返工，说明该问的没问。

### 在这个过程中有一些坑需要避免

1. 让模型自己反思再答没啥用：DeepMind 测过，没有外部信号的纯自我纠正，准确率不升反降。我们自己也试过在 system prompt 里加"交付前必须反思三次"，效果并没有什么变化。
2. 拿模型自己的置信度当停止信号不靠谱：在上文的那个过度自信研究中其实测试并验证了，执行中途的自我怀疑，在成功和失败的轨迹里出现频率是一样的。
3. 使用裁判很容易犯的错：**简单直接把完整上下文给到裁判判"是否完整"**，如果要用裁判，必须是新的上下文、加上判据、和对抗式框架。如果把完整上下文原封不动地给到裁判，冗长但没有新信息的答案大概率反而拿高分。
4. 反复追问"你确定吗"：Anthropic 测过，被这么挑战的时候，模型有时候会把本来正确的答案改错。我们想要的是复核，结果拿到的是顺从。

说到底就一条：**校准信号必须来自执行者之外**。

### 判据来源于对业务的理解

上述机制在工程上都能实现，但是机制解决的是"由谁验证、在哪里验证"，而"什么算完成"这个定义本身，只能来自对业务的理解。

以两类任务做对比。代码任务的判据成本几乎为零：测试通过即完成，验证由编译器和测试框架承担。调研类任务则不存在等价物，到底覆盖几个信息源算充分、多少个检索角度算穷尽、零结果在什么条件下是合法答案、口径的取舍是否允许 agent 自主决定，每一条判据都依赖业务经验，没有任何框架能够代答。

在整套停止设计中价值最高的部分就来自于把"这个业务里什么算完成、什么算无效投入、什么必须交由用户决策"逐条显式化。然而当前这项工作必须有人的参与。

## 讨论：更聪明的模型会让停止设计过时吗

Fable 5、GPT-5.6 都已经发布，甚至更聪明的模型后续也会到来，所以有个问题绕不开：模型都这么聪明了，停止设计还有必要吗？

《Agentic Uncertainty Reveals Agentic Overconfidence》测的就是当前这代前沿模型（2026 年 2 月，GPT-5.2-Codex、Gemini-3-Pro、Claude Opus 4.5）。两年来，模型能力涨了，"知道自己做没做完"这个事没跟着涨。原因其实正文里已经写了：这是对齐问题，不是能力问题。自评和执行共享同一套权重，训练优化的又是"看起来做完了"这个 proxy——模型越强，"看起来做完了"也做得越逼真，两边是一起涨的。

而且交付质量是个乘法，能力上限越高，兑现率每丢一个点的绝对损失越大。一线大模型厂商也在用脚投票：卖最强模型的那几家，配套发的恰恰是最重的停止机制——Stop hook、/goal、output guardrail、RubricMiddleware；2026 年 5 月的综述《Reinforcement Learning for LLM-based Multi-Agent Systems through Orchestration Traces》，针对多智能体编排的五个子决策，明确指出"何时停止"是唯一至今没有任何 RL 训练方法的。

更聪明模型的到来针对停止设计带来的改变可能是：软约束在强模型上更好使了（GPT-5.2 之后 OpenAI 的指南从硬性工具上限转向语义停止判据），验证分级也可以放松；而停止设计反而是 agent 能力趋同之后，剩下的少数真差异点——机制会普及，沉淀在业务里的判据不会。

最后说一句：能力决定 agent 能到多好，停止设计决定它实际交付多好。

## 参考文献

### 论文

- Cemri et al., 《Why Do Multi-Agent LLM Systems Fail?》（MAST），ICML 2025 — [arXiv:2503.13657](https://arxiv.org/abs/2503.13657)。故障占比表与"过早终止 / 不知道终止条件 / 步骤重复 / 该问不问"的定义与频率来源。
- Cuadron et al., 《The Danger of Overthinking: Examining the Reasoning-Action Dilemma in Agentic Tasks》 — [arXiv:2502.08235](https://arxiv.org/abs/2502.08235)。premature disengagement：基于内部推断而非环境反馈的提前收手。
- Kaddour et al., 《Agentic Uncertainty Reveals Agentic Overconfidence》 — [arXiv:2602.06948](https://arxiv.org/abs/2602.06948)。SWE-bench Pro 上实际成功率 22% vs 自估 77%；中途自我怀疑无信息量（坑 #2）。
- Chen et al.（腾讯 AI Lab），《Do NOT Think That Much for 2+3=? On the Overthinking of o1-Like LLMs》 — [arXiv:2412.21187](https://arxiv.org/abs/2412.21187)。2+3 生成 13 种解法、901 个 token。
- Ghosal et al., 《Does Thinking More always Help? Mirage of Test-Time Scaling in Reasoning Models》，NeurIPS 2025 — [arXiv:2506.04210](https://arxiv.org/abs/2506.04210)。GSM8K 思考 token 1,100→15,980、准确率 87.3%→70.3%。
- Lu et al., 《Runaway is Ashamed, But Helpful: On the Early-Exit Behavior of LLM-based Agents in Embodied Environments》，EMNLP 2025 Findings — [arXiv:2505.17616](https://arxiv.org/abs/2505.17616)。卡住循环的行为刻画；退出机制削减 50–70% 冗余步骤。
- Muennighoff et al., 《s1: Simple test-time scaling》 — [arXiv:2501.19393](https://arxiv.org/abs/2501.19393)。budget forcing，AIME24 50%→57%。
- Wang, Liu et al., 《Thoughts Are All Over the Place: On the Underthinking of o1-Like LLMs》，NeurIPS 2025 — [arXiv:2501.18585](https://arxiv.org/abs/2501.18585)。思路切换惩罚（TIP），硬题 +2–4 个点。
- Lightman et al., 《Let's Verify Step by Step》 — [arXiv:2305.20050](https://arxiv.org/abs/2305.20050)。过程监督（PRM）起源；面向工具轨迹的过程奖励见 ToolPRMBench — [arXiv:2601.12294](https://arxiv.org/abs/2601.12294)。
- 《Beyond pass@1: A Reliability Science Framework for Long-Horizon LLM Agents》 — [arXiv:2603.29231](https://arxiv.org/abs/2603.29231)。pass@1 从短任务 76.3% 衰减到超长任务 52.1%。
- Ren et al., 《Robots That Ask For Help: Uncertainty Alignment for Large Language Model Planners》（KnowNo），CoRL 2023 最佳学生论文 — [arXiv:2307.01928](https://arxiv.org/abs/2307.01928)。conformal prediction 校准"何时问人"。
- Huang et al., 《Large Language Models Cannot Self-Correct Reasoning Yet》，ICLR 2024 — [arXiv:2310.01798](https://arxiv.org/abs/2310.01798)。无外部信号的自我纠正让准确率下降（坑 #1）。
- Zheng et al., 《Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena》，NeurIPS 2023 — [arXiv:2306.05685](https://arxiv.org/abs/2306.05685)。裁判偏好冗长答案等系统性偏置（坑 #3）。
- Sharma et al.（Anthropic），《Towards Understanding Sycophancy in Language Models》 — [arXiv:2310.13548](https://arxiv.org/abs/2310.13548)。被追问时改掉正确答案（坑 #4）。
- 《SYCON Bench》 — [arXiv:2505.23840](https://arxiv.org/abs/2505.23840)。多轮压力下的顺从性测量；推理调优可降低顺从最多 21.6%（讨论节）。
- Zhang, 《Reinforcement Learning for LLM-based Multi-Agent Systems through Orchestration Traces》 — [arXiv:2605.02801](https://arxiv.org/abs/2605.02801)。多智能体编排五个子决策中，"何时停止"暂无任何 RL 训练方法（讨论节）。

### 框架与官方文档

- Anthropic，《How we built our multi-agent research system》，2025-06 — [anthropic.com](https://www.anthropic.com/engineering/multi-agent-research-system)。分档努力预算（1 agent / 3–10 次调用等）。
- OpenAI，《Introducing deep research》 — [openai.com](https://openai.com/index/introducing-deep-research/)。端到端 RL 训练浏览与坚持。
- OpenAI，《GPT-5 prompting guide》（GPT-5.1 更新）— [developers.openai.com](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5_prompting_guide)。"It's very bad to leave the user hanging."
- Vercel AI SDK 文档，《Tool Calling / Building Agents》 — [ai-sdk.dev](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)。停止条件"仅在最后一步含工具结果时评估"；纯文本步即终止。
- AutoGen 《Termination Conditions》 — [microsoft.github.io/autogen](https://microsoft.github.io/autogen/stable/reference/python/autogen_agentchat.conditions.html)（不配终止条件将 "run indefinitely"）；LangGraph `recursion_limit` — [docs.langchain.com](https://docs.langchain.com/oss/python/langgraph/errors/GRAPH_RECURSION_LIMIT)。
- Claude Code 文档，《Best practices》（"looks done" 引文）与 《Hooks guide》（Stop hook 连拦 8 次上限）— [code.claude.com](https://code.claude.com/docs/en/best-practices)。
- LangChain，《Introducing Rubrics for deepagents》（RubricMiddleware，2026-06）— [langchain.com](https://www.langchain.com/blog/introducing-rubrics-for-deepagents)。运行时完成度闸门："拿不到终审判决就不许结束"（讨论节）。
