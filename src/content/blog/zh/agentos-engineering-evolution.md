---
title: 简述 AgentOS 工程发展
description: 从 prompt 工程到自进化，六年里 agent 工程经历的五个阶段。全都在为同一件事打补丁：CPU 是概率性的。
pubDate: 2026-07-27
tags: ['AgentOS', 'Agent 工程']
---

## 一、AgentOS 的起源

文章开始先澄清下：当前市面上把产品直接命名为"AgentOS"的公司不止一家。本文说的 AgentOS 是一个概念框架，不指其中任何一家。

2023 年 11 月，Karpathy 发了条推文，配了张很有名的草图，把 LLM 生态画成一台计算机。推文写得像张配置单："LLM OS——处理器：GPT-4 Turbo，256 核（batch size），主频 20Hz（tok/s）；内存：128K token；文件系统：Ada002。"

"LLM 是新计算机的 CPU"这个视角，从这条推开始出圈。

比他晚一个月，Rutgers 发了《LLM as OS, Agents as Apps》把完整映射画了出来；再过一个季度，同一个实验室把图纸变成了真系统：AIOS，一个带 scheduler、memory manager、access manager 的 agent 内核。

本文要讲的重点是 AgentOS 工程技术体系的演化过程。从 GPT-3 至今的六年里，它经历过四次大的变化：prompt 工程、上下文工程、harness 工程、loop 工程；再加上现在大家还在探索的第五个阶段，自进化的 AgentOS。

<div class="timeline">
<ol>
<li>
<p class="timeline-era"><span class="timeline-span">2020–2023</span> Prompt 工程</p>
<p class="timeline-note">没有系统软件，直接对裸机编程：一次任务就是一次调用，调完归零。</p>
<ul class="timeline-marks">
<li><time datetime="2020-05">2020-05</time><span>GPT-3，few-shot 提示可用</span></li>
<li><time datetime="2022-01">2022-01</time><span>Chain-of-Thought</span></li>
<li><time datetime="2023-05">2023-05</time><span>Tree of Thoughts</span></li>
</ul>
</li>
<li>
<p class="timeline-era"><span class="timeline-span">2023–2025</span> 上下文工程</p>
<p class="timeline-note">补上内存和硬盘。模型一点没动，动的全是喂给它的上下文。</p>
<ul class="timeline-marks">
<li><time datetime="2020-05">2020-05</time><span>RAG 论文发表，当时没什么用武之地</span></li>
<li><time datetime="2022-10">2022-10</time><span>LangChain、LlamaIndex</span></li>
<li><time datetime="2025-06">2025-06</time><span>context engineering 被统一叫响</span></li>
</ul>
</li>
<li>
<p class="timeline-era"><span class="timeline-span">2024–2026</span> Harness 工程</p>
<p class="timeline-note">补上内核、沙箱与进程管理，零件被组装成整机。</p>
<ul class="timeline-marks">
<li><time datetime="2022-10">2022-10</time><span>ReAct，把想-做-看写成显式循环</span></li>
<li><time datetime="2023-06">2023-06</time><span>OpenAI function calling</span></li>
<li><time datetime="2024-03">2024-03</time><span>Devin，SWE-bench 从 1.96% 到 13.86%</span></li>
<li><time datetime="2025-03">2025-03</time><span>Manus，云沙箱里的一台整机</span></li>
</ul>
</li>
<li>
<p class="timeline-era"><span class="timeline-span">2026–</span> Loop 工程</p>
<p class="timeline-note">调度器真正立起来。核心不是让它转，而是定义它什么时候该停。</p>
<ul class="timeline-marks">
<li><time datetime="2025">2025</time><span>Ralph，一行 bash 的循环</span></li>
<li><time datetime="2026-03">2026-03</time><span>Claude Code /loop</span></li>
<li><time datetime="2026-05">2026-05</time><span>/goal，完成条件交给独立评估器判定</span></li>
</ul>
</li>
<li>
<p class="timeline-era"><span class="timeline-span">2026–</span> 递归自我改进</p>
<p class="timeline-note">还在探索。目前有界、不爆炸。</p>
<ul class="timeline-marks">
<li><time datetime="2025">2025</time><span>Darwin Gödel Machine，SWE-bench 从 20% 到 50%</span></li>
<li><time datetime="2025">2025</time><span>SEAL，模型改自己的权重</span></li>
</ul>
</li>
</ol>
</div>

## 二、与传统 OS 的对比

左边是传统计算机，右边是 agent 系统，现在做个类比：

| 传统计算机        | AgentOS                                  | 说明                                       |
| ----------------- | ---------------------------------------- | ------------------------------------------ |
| CPU               | 大模型                                   | 唯一的计算单元                             |
| 时钟周期          | 一次前向推理                             | 每个 token 一拍，"主频"以 tok/s 计         |
| CPU 缓存（L1/L2） | KV Cache / prompt cache                  | 命中与否是 10 倍价差（Claude Sonnet：缓存读 $0.30 vs 输入 $3/MTok） |
| 内存（RAM）       | 上下文窗口                               | 容量有限、访问最快、任务结束即清空         |
| 虚拟内存换页      | 上下文压缩与卸载                         | 满了就把不活跃的部分换出去（MemGPT）       |
| 磁盘 / 文件系统   | 外部记忆与文件（云存储、本地盘、向量库） | 空间大、持久存储、访问较慢                 |
| 系统调用          | 工具调用（function calling）             | 模型请求外部能力                           |
| 网络协议          | MCP、A2A 等 agent 间协议                 | MCP 连外设（官方类比是 USB-C），A2A 连主机 |
| 进程              | 一次 agent 任务                          | 子 agent 约等于 fork 出来的子进程          |
| 中断              | HITL、hooks                              | 外部事件打断执行流                         |
| 保护模式 / 权限   | 沙箱、permissions、guardrails            | 不让程序越界乱写                           |

相比传统 CPU，这里有一个最重要的差异：

传统 CPU 是确定性的，同样的指令、同样的输入，永远得到同样的输出。

LLM 是概率性的：同一个 prompt，两次运行可以给出不同答案；它会一本正经地执行一条不存在的"指令"；它的正确率是一个分布，不是一个保证。

在传统 OS 的发展过程中，从来没有哪个内核需要防备"CPU 幻觉出一条指令"，而 agent 工程这几年，几乎全部都在为这一个差异进行打补丁。我们反复看到了同一件事：传统 OS 的某个子系统被搬过来，为了适配概率性的 LLM，被改造得面目全非。

尝试下一个定义：

> **AgentOS：一层系统软件，负责管理概率性的处理器的算力（模型调用）、内存（上下文）、存储（外部记忆）、I/O（工具与协议）和调度（执行循环），把一颗不可靠的 CPU，组装成一台可靠的计算机。**

接下来简单按时间顺序讲这套系统软件的发展历程。

## 三、Prompt 工程（2020–2023）

GPT-3（2020 年 5 月）证明了 few-shot 提示可用——不用微调，把例子写进输入就能让模型干活。那时候没有任何"系统软件"，相当于直接对裸机编程：一个任务就是一次函数调用，调用结束，一切归零。

这个时代标志性的产出就是一堆 prompt 技巧。Chain-of-Thought（Google，2022 年 1 月）发现让模型"一步一步想"能大幅提升推理；Tree of Thoughts（2023 年 5 月）把单条思维链扩成搜索树；再加上社区攒出来的各种调用约定比如：提问带角色、按模板给格式、要求输出 Markdown、"你是一位资深专家"。当时管这些叫 prompt 工程，回头看，它们和早期程序员手写汇编、琢磨调用约定是同一件事：**在没有操作系统的机器上，靠技巧直接压榨处理器**。

这个时期大模型支持的上下文长度很短：GPT-3 只有 2048 个 token，之后的主流模型也就 16K、32K 的量级。放进上下文的每样东西都很珍贵，指令、few-shot 例子、用户的问题都在抢同一块地方，多塞一个例子就得删掉点别的，而且模型还有 lost in the middle 的问题。所以在那个年代，把上下文组装好本身就是硬功夫：放什么、放多少、按什么顺序、指令搁头还是搁尾，全是要反复调试的技巧。

## 四、上下文工程（2023–2025）

虽然"上下文工程"这个词 2025 年才开始火，但从 RAG 爆发以来，大家做的其实一直是上下文工程的事。ChatGPT 出圈之后，所有人撞到的第一堵墙就是：模型不知道你的东西。知识冻结在训练截止日，上下文窗口又小得可怜：GPT-3.5 只有 4K token，GPT-4 初版也才 8K。而几乎每家公司想做的第一件事都一样："能不能让它回答我们自己文档里的问题？"裸机做不到这个：上下文太小，也没有外部存储的接口。

其实 RAG 论文 2020 年就发表了（和 GPT-3 论文几乎同周），只是当时没什么大规模用武之地。契机是 LangChain（2022-10）和 LlamaIndex（2022-11）的出现，2023 年随着 ChatGPT 生态一起爆发，顺带带火了向量数据库一整个赛道。

RAG 本身不复杂：离线把文档切块、进行 embedding 存进向量库；提问时把问题也转成向量，按相似度捞出最最相似的几块，和问题一起拼进 prompt，让模型带着资料答题。注意整个过程模型一点没动，动的全是喂给它的上下文。

效果是立竿见影的：不重训就能回答新知识，内部文档能问了，答案带出处，成本比微调低几个量级。2023 年，"企业知识库问答"一度就是 AI 应用的代名词。

但做过的人都知道 demo 和生产之间到底差多远。切块会把语义切碎，"相似"不等于"相关"，问"对比 A 和 B 的方案"，检索经常只捞回 A；于是我们调 chunk 大小、调 top-k、换 embedding 模型，成了一门玄学。还有两个更根本的限制，当时没几个人看清：RAG 是只读的，模型能"看"外部世界，但动不了它（查数据库可以，改数据库不行）；它也是单跳的，检索一次、回答一次，管线是写死的，但是复杂问题不是一次性就能回答的，需要"查一点、想一想、再查一点"。

回头看，这个时期真正留下来的，就是一个最基础的思考：往上下文里塞什么、塞多少、按什么顺序。这个问题后来越滚越大，从"检索拼接"进化成一个完整的工程，就是 2025 年 6 月才出圈、被统一认可的 context engineering。

## 五、Harness 工程（2024–2026）

RAG 并不能让 agent 真正动起来，我们需要的是让 agent 可以跨很多步地行动。这件事 2023 年春天已经有人抢先试过：AutoGPT 让 GPT-4 自己规划、自己调工具、自己循环，当时是 GitHub 上的明星项目。但它很快被发现不能用，转圈、跑偏、一晚上烧掉几十美元产出一堆废文件。现在回看问题不在"循环"本身，而在循环底下什么都没有：没有隔离的执行环境，没有错误恢复，没有状态，没有对危险动作的约束。这些缺口催生了 harness 工程。

ReAct（2022 年 10 月）把"想一步、做一步、看一眼结果"写成了显式循环，Toolformer（2023 年 2 月）让模型自己学会什么时候调 API，2023 年 6 月 OpenAI 上线 function calling，工具调用第一次成为模型 API 的官方接口。但是那时候没有人把它们组合起来，都是一堆零件。从 Devin（Cognition，2024 年 3 月）开始，整机出现了："配备了 shell、代码编辑器和浏览器，运行在沙箱化的计算环境中"，在 SWE-bench 上端到端解决 13.86% 的 issue，此前最好成绩才 1.96%。

harness 到底由哪几部分组成，各家厂商的框架细节不一，但是对照 Claude Agent SDK、OpenAI Agents SDK、LangGraph 这几家各自的构件清单，大致有六个部分，每一部分都在 OS 里有原型：

<figure>
<div class="stack">
<ol>
<li><span class="stack-part">工具与动作接口（ACI）</span><span class="stack-os">指令集 / 系统调用约定</span></li>
<li><span class="stack-part">上下文管理与压缩</span><span class="stack-os">内存管理与换页</span></li>
<li><span class="stack-part">记忆与状态</span><span class="stack-os">寄存器 + 磁盘</span></li>
<li><span class="stack-part">子 agent 编排</span><span class="stack-os">多进程与 fork</span></li>
<li><span class="stack-part">验证与自我纠正</span><span class="stack-os stack-none">OS 里没有对应物</span></li>
<li><span class="stack-part">权限与控制</span><span class="stack-os">保护模式</span></li>
</ol>
<div class="stack-cross">可观测性 · dmesg / strace</div>
</div>
<figcaption>六个部件，五个能在 OS 里找到原型。唯一找不到的那个，正是概率 CPU 逼出来的。</figcaption>
</figure>

- **工具与动作接口（ACI）= 指令集与系统调用约定**。ACI 这个概念出自 SWE-agent：agent 能调哪些工具、动作怎么表达、环境怎么回话，直接决定它能不能干活。
- **上下文管理与压缩 = 内存管理与换页**。一次任务里上下文会不断被工具结果撑满，harness 得动态决定塞什么、把不活跃的压缩或换出（compaction）、给下一步腾地方。典型是 Manus 那套文件系统当外部内存、Claude Code 的自动 compaction。
- **记忆与状态 = 寄存器 + 磁盘**。几乎每家都把它拆成两层：短期的线程状态（sessions、checkpoints，任务能挂起、恢复、回滚），和长期的跨会话记忆（结构化笔记、外部 store、CLAUDE.md 这类）。前者像进程被换出时保存的寄存器现场，后者像写到磁盘的持久数据。长期记忆这层眼下还很粗糙，LongMemEval 实测，主流模型在跨会话记忆任务上准确率掉 30%。
- **子 agent 编排 = 多进程与 fork**。把一块工作丢进一个独立上下文窗口的子 agent 去做，做完只把结论带回来；OpenAI 把 handoff 直接列为核心原语，Anthropic 用它做"规划者/执行者/评估者"的分工。既是并行，也是隔离：子 agent 的上下文脏了不影响主线。
- **验证与自我纠正**。这一部分在传统 OS 里找不到对应物——确定性的 CPU 算完就是对的，没人去"验证"加法算没算错。但概率 CPU 会给出看似合理其实错的结果，所以 harness 必须在每一步之后加一道核对：跑测试、比对设计稿、让另一个模型当裁判。
- **权限与控制 = 保护模式**。哪些工具能跑、危险动作要不要人确认、代码在不在沙箱里跑，以及授权：permission 模式、工具白名单、hooks。

外加横切关注点：**可观测性 = 日志与追踪**。模型输出不稳定，必须能回放每一步到底发生了什么、在哪一步跑偏，才谈得上调试和评估（LangSmith、Langfuse、OpenAI 内置的 tracing 就是干这个的），相当于 OS 的 dmesg 和 strace。

这个时代早期最出圈的实践是 Manus（2025 年 3 月 6 日）：云沙箱里一台完整的虚拟计算机，浏览器、shell、文件系统、代码执行加自主规划。季逸超那篇《Context Engineering for AI Agents》（2025 年 7 月）是 harness 时代很有价值的工程复盘，主要讲了 KV-cache 命中率是第一指标（缓存命中与否 10 倍价差）、工具要用 logits 屏蔽而不是动态增删（否则毁缓存）、文件系统当无限上下文用、靠反复重写 todo.md 把目标"背诵"进注意力窗口、**把出错的尝试留在上下文里**（"错误恢复是真正 agent 行为的最清晰标志"）。

这个时代的方法论，Anthropic 后来在《Harness design for long-running application development》（2026 年 3 月）里浓缩成了一句话：**"harness 里的每个组件，都编码了一个'模型自己还做不到什么'的假设。"** 这些假设可能一开始就不对，也会随着模型变强而过期。

## 六、Loop 工程（2026–）

到 2026 年，工程圈冒出个新词：loop engineering。最早是 Geoffrey Huntley 2025 年中提出的 Ralph，纯粹形态就一行 bash：`while :; do cat PROMPT.md | claude-code ; done`，让 agent 读同一份提示反复跑。把它顶上主流的是 Claude Code 的作者 Boris Cherny，他在 Anthropic 开发者大会上说了一句被反复引用的话："我已经不 prompt Claude 了，我写循环，让循环去 prompt 它。"

这想法 AutoGPT 2023 年就有了，区别是这次 loop 下垫着整整一个 harness 时代的成果，写循环从"搭空壳"变成了"编排一套本来就能用的原语"。这些原语怎么一件件被收进单一循环的，Claude Code 本身的 changelog 就能很清晰地说明：

| 时间    | 功能                                            | 内化了什么                                                                  |
| ------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| 2025-02 | research preview 发布                           | 终端里的 agent loop 首次产品化                                              |
| 2025-05 | GA + SDK                                        | harness 本身成为可复用组件                                                  |
| 2025-07 | Hooks                                           | 验证外化成确定性脚本，Stop hook 可以拦住"想收工的循环"                      |
| 2025-07 | Subagents                                       | 委派与上下文隔离成为原语（fork 子进程）                                     |
| 2025-09 | Checkpoints / rewind；SDK 更名 Claude Agent SDK | 状态快照与可逆执行；harness 从编码泛化到通用 agent                          |
| 2025-10 | Agent Skills                                    | 能力按需渐进加载，扩展动作空间不撑爆上下文                                  |
| 2025-11 | Code execution with MCP                         | 动作从 N 次离散工具调用变成模型自写代码（示例任务 token 从 15 万降到 2 千） |
| 2026-05 | /goal                                           | 持久完成条件：每轮结束由独立评估器判定"真的可以停了吗"                      |

Ralph 沉淀出几条后来通用的配方：

- 每轮开一个干净上下文（长循环里上下文会越滚越脏）；
- 状态不留在上下文里、写到文件系统上（一份 plan、一份进度日志，下轮重读）；
- plan 每项带成功判据，干完自己核对、没达成就带干净上下文重来；
- 要并行就 spawn 子 agent，主线始终单线程（2025 年 Cognition 的"Don't Build Multi-Agents"和 Anthropic 的"多智能体比单 agent 好 90%"吵过一轮，最后收敛的共识是：并行去读，单线程去写）。

到 2026 年，主流 harness 把这套配方做成了内置命令：Claude Code 的 `/loop`（3 月）和 `/goal`（5 月），Codex、Hermes 同期也上了 `/goal`。`/goal` 的说明书很直白——"设一个完成条件，让它自己做到满足为止"。写循环的核心从来不是让它转起来，而是定义它什么时候该停。

但是 loop 也把成本问题放大了：实测同一个任务，不同 agent 的 token 消耗能差出 30 倍，而且花得多不等于做得对。不少人试过就放弃，嫌 agent 漂移、账单吓人。

## 七、递归自我改进（RSI，2026–）

最近两个月，RSI 的声浪也逐渐起来了：让 agent 改进自己，甚至改进它"改进自己"的那套逻辑。这个想法很老，I.J. Good 1965 年就写过"智能爆炸"，Schmidhuber 2003 年的 Gödel Machine 给过严格形式：证明一个自我改写确实有益，才执行它，但也一直卡死在"证明有益"这一步上。LLM 让它复活，一是因为改进者和被改的东西第一次活在同一介质里（模型读写的，正是构成它自己脚手架的 prompt、工具和代码）；二是"证明"被换成了便宜得多的跑分验证。

目前真实存在的系统，由浅到深排一下：

<figure>
<ol class="tiers">
<li style="--depth: 0">
<p class="tier-name"><span>工件级别</span>改记忆、技能库、prompt</p>
<p class="tier-note">执行任务的模型没变，坏了能回滚。验证器最硬：跑一遍就知道有没有变好。</p>
</li>
<li style="--depth: 1">
<p class="tier-name"><span>系统级别</span>改调用自己的那套脚手架</p>
<p class="tier-note">用跑分替代 Gödel Machine 要求的“证明有益”。DGM 走到了改自己代码、维护进化档案。</p>
</li>
<li style="--depth: 2">
<p class="tier-name"><span>权重级别</span>改模型自己的权重</p>
<p class="tier-note">最深的一层，也是唯一不可回滚的一层。SEAL 在这里最早撞上灾难性遗忘。</p>
</li>
</ol>
<figcaption>越往深走，改动越不可逆，而能用来判断“改好了没有”的验证器越软。</figcaption>
</figure>

**工件级别**：工件在改进，但执行任务的模型没变，坏了能回滚。

- 记忆：比如 Letta 让后台 agent 趁空闲整理记忆，像夜间碎片整理
- 技能库：比如 Voyager 攒可执行的代码技能，SkillOS 用 RL 做技能策展
- prompt：比如 GEPA 用进化算法改提示词

**系统级别**：形成闭环的系统性改进。

- STOP、ADAS 让固定的模型去改写调用它的脚手架；STOP 的作者自己说了"模型未被改动，不算完整 RSI"，ADAS 的 meta-agent 本身也是固定的
- Sakana 的 Darwin Gödel Machine（2025）更进一步，改自己的代码、维护进化档案、用跑分替代证明，80 轮迭代把 SWE-bench 从 20% 爬到 50%（算是目前唯一真跑通多轮自指递归的系统）

**权重级别**：最深的一层。

- MIT 的 SEAL 让模型自己生成微调数据、更新自己的权重，也是最早撞上灾难性遗忘

但离"智能爆炸"很远，而且有一些根本性原因。一，现在递归只在编码这种能容易验证的域跑通，DGM 一趟要跑两周很烧钱；验证器越硬（编译、测试）改进越真实，越软（人类偏好、模型互评）改进越虚，2026 年的 RSI 综述把这叫"验证器硬度梯度"，给的结论是现阶段 RSI 有界、不爆炸。二，自我改进会主动坍缩：拿自己生成的数据递归自训，分布尾部会丢（Nature 2024 的 model collapse）；拿自己当奖励来源，RL 会突然坍缩成常数回答（SRT）；连验证器都会被钻空子。

## 八、观察与判断

回看这五个阶段，有两条线始终贯穿。

**第一条：每个阶段都是在为一个概率性的 CPU 补子系统。** prompt 补的是调用约定，RAG 补内存和硬盘，harness 补内核、沙箱和进程管理，loop 把调度器真正立起来，MCP/A2A 补驱动和网络。反过来看，这其实就是冯·诺依曼结构下，管理一个计算单元所需要的东西。

**第二条：脚手架的下场，大概率是被吸收。** CoT 曾是 prompt 技巧，推理模型把它内化了；RAG 曾是必备架构，长上下文和检索训练吃掉了它的大半场景；harness 的规划、验证、护栏，正被 loop 收编为原语；loop 本身，又正被端到端 RL 练进权重，OpenAI 的 deep research 可能就是这么练出来的。

<figure>
<div class="dgm">
<svg viewBox="0 0 560 252" role="img" aria-labelledby="dgm-absorb-t dgm-absorb-d">
<title id="dgm-absorb-t">脚手架被吸收的路径</title>
<desc id="dgm-absorb-d">三条层级线，自上而下为上层脚手架、内核与原语、模型权重。CoT 与 RAG 从脚手架直接沉入模型权重，分别被推理模型和长上下文加检索训练吸收；harness 的规划与验证下沉一层，被 loop 收编为原语；loop 自身再被端到端 RL 练进权重。</desc>
<defs><marker id="dgm-absorb-head" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L8 4 L0 8 z" class="dgm-head" /></marker></defs>
<text x="100" y="28" class="dgm-label">时间 →</text>
<text x="86" y="74" class="dgm-soft" text-anchor="end">上层脚手架</text>
<text x="86" y="149" class="dgm-soft" text-anchor="end">内核 / 原语</text>
<text x="86" y="224" class="dgm-soft" text-anchor="end">模型权重</text>
<line x1="100" y1="70" x2="548" y2="70" class="dgm-rule" />
<line x1="100" y1="145" x2="548" y2="145" class="dgm-rule" />
<line x1="100" y1="220" x2="548" y2="220" class="dgm-rule" />
<circle cx="150" cy="70" r="3" class="dgm-head" /><text x="150" y="58" class="dgm-text" text-anchor="middle">CoT</text>
<path d="M150 74 L150 212" class="dgm-arrow" marker-end="url(#dgm-absorb-head)" />
<text x="150" y="240" class="dgm-soft" text-anchor="middle">推理模型</text>
<circle cx="262" cy="70" r="3" class="dgm-head" /><text x="262" y="58" class="dgm-text" text-anchor="middle">RAG</text>
<path d="M262 74 L262 212" class="dgm-arrow" marker-end="url(#dgm-absorb-head)" />
<text x="290" y="240" class="dgm-soft" text-anchor="middle">长上下文 + 检索训练</text>
<circle cx="412" cy="70" r="3" class="dgm-head" /><text x="412" y="58" class="dgm-text" text-anchor="middle">harness 规划 / 验证</text>
<path d="M412 74 L412 137" class="dgm-arrow" marker-end="url(#dgm-absorb-head)" />
<text x="412" y="164" class="dgm-soft" text-anchor="middle">收编为 loop 原语</text>
<circle cx="512" cy="145" r="3" class="dgm-head" /><text x="512" y="133" class="dgm-text" text-anchor="middle">loop</text>
<path d="M512 149 L512 212" class="dgm-arrow" marker-end="url(#dgm-absorb-head)" />
<text x="512" y="240" class="dgm-soft" text-anchor="middle">端到端 RL</text>
</svg>
</div>
<figcaption>每一代脚手架都在往下沉。沉到权重里的那部分，就不再是任何人的竞争力。</figcaption>
</figure>

由此我们需要思考一个问题，那到底什么不会被吸收？还是看下传统的计算机：CPU 五十年快了百万倍，OS 也在变薄，但从来没有消失，有三样东西天生不属于 CPU：私有数据（记忆与上下文资产）、业务判据（什么算把任务做对，这来自业务）、验证器（独立于计算单元的 ground truth）。模型每变强一代，AgentOS 就薄一层；剩下的那一层，才是真正值得投入的地方。

顺着这条往下想，如果你在做 agent 产品，会得出一个判断：竞争力不在内核，在上层。

对 AgentOS 分层来看：

- 内核：模型调用、上下文管理、工具协议、执行循环会商品化，收敛到少数几家、且主要由模型厂商定义。一是因为内核最值钱的部件（KV cache、compaction、把规划和验证练进权重）本来就贴着模型权重，别人做不到最好；二是协议正在开放标准化，A2A 已经进了 Linux 基金会，走的是 TCP/IP、POSIX 那种开放标准的路，而不是各家私有 OS。所以在内核层拼自研，对一家应用公司没有前途。

- 上层才是竞争力所在，但上层也要分清两种。一种是 UI、内置功能这类产品优势，能拉开一时差距，却和历史上无数被系统原生功能吃掉的 App 一样，随时可能被平台方收编；另一种才是结构性安全的，绑定自己业务的数据、判据、验证器，也就是上面那三样。平台再强，也拿不走自己积累的业务数据、"什么算把这个任务做对"的定义、以及怎么独立验证结果靠不靠谱。

所以重心该放在上层。现在很多团队自建了不少基础能力，那多半是因为 OS 还不完善，为了把产品跑起来不得不建。值得为未来做的准备有两条：一，自建的内核能力藏在干净的接口后面，面向未来的标准写、而不是面向自己这版实现写，等标准成熟才能换得快、换得起；二，真正值得往深做的，是那些"长在内核接缝里的上层能力"，比如停止校准、领域验证器，它们看着像内核，实则是绑定业务的护城河。

---

## 参考文献

- Brown et al., 《Language Models are Few-Shot Learners》（GPT-3），2020-05 — [arXiv:2005.14165](https://arxiv.org/abs/2005.14165)
- Lewis et al., 《Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks》，2020-05 — [arXiv:2005.11401](https://arxiv.org/abs/2005.11401)
- Wei et al., 《Chain-of-Thought Prompting Elicits Reasoning in Large Language Models》，2022-01 — [arXiv:2201.11903](https://arxiv.org/abs/2201.11903)
- Yao et al., 《ReAct: Synergizing Reasoning and Acting in Language Models》，2022-10 — [arXiv:2210.03629](https://arxiv.org/abs/2210.03629)
- Schick et al., 《Toolformer: Language Models Can Teach Themselves to Use Tools》，2023-02 — [arXiv:2302.04761](https://arxiv.org/abs/2302.04761)
- Yao et al., 《Tree of Thoughts: Deliberate Problem Solving with Large Language Models》，2023-05 — [arXiv:2305.10601](https://arxiv.org/abs/2305.10601)
- Liu et al., 《Lost in the Middle: How Language Models Use Long Contexts》，2023-07 — [arXiv:2307.03172](https://arxiv.org/abs/2307.03172)
- Packer et al., 《MemGPT: Towards LLMs as Operating Systems》，UC Berkeley，2023-10 — [arXiv:2310.08560](https://arxiv.org/abs/2310.08560)。虚拟上下文管理：RAM/磁盘分层、换页、中断。后演化为 Letta（2024-09 出 stealth）。
- Karpathy，"LLM OS" 推文（2023-11-11）与 《Intro to Large Language Models》 演讲（2023-11）
- Zhang et al.（Rutgers），《LLM as OS, Agents as Apps》，2023-12 — [arXiv:2312.03815](https://arxiv.org/abs/2312.03815)；同实验室 《AIOS: LLM Agent Operating System》，2024-03 — [arXiv:2403.16971](https://arxiv.org/abs/2403.16971)
- Cognition，《Introducing Devin》，2024-03-12 — [cognition.com](https://cognition.com/blog/introducing-devin)
- Yang, Jimenez et al., 《SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering》，NeurIPS 2024 — [arXiv:2405.15793](https://arxiv.org/abs/2405.15793)
- Shumailov et al., 《AI models collapse when trained on recursively generated data》，Nature，2024-07
- Cognition，《Don't Build Multi-Agents》，2025-06-12 — [cognition.com](https://cognition.com/blog/dont-build-multi-agents)
- Anthropic，《How we built our multi-agent research system》，2025-06
- 季逸超（Peak Ji），《Context Engineering for AI Agents: Lessons from Building Manus》，2025-07
- I.J. Good, 《Speculations Concerning the First Ultraintelligent Machine》，Advances in Computers vol.6，1965
- Schmidhuber, 《Gödel Machines: Self-Referential Universal Problem Solvers》，2003
- Gergely Orosz / Addy Osmani，《What is Loop Engineering?》，The Pragmatic Engineer
- OpenAI，《Introducing deep research》
