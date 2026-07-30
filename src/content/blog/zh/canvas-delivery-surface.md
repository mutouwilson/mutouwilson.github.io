---
title: Canvas：Agent 的交付载体
description: 这两年的 AI 产品几乎都在对话框旁边加了一块能动手改的地方。壳会被平台抹平，长在壳里的业务交付语义不会。
pubDate: 2026-07-30
tags: ['Canvas', 'Agent 工程']
---

这两年的 AGENT 产品如雨后春笋般快速出现，大家在设计界面的时候，几乎都在对话框旁边，加了一块能让用户动手修改的区域。

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 820 300" role="img" aria-labelledby="fig1t">
      <title id="fig1t">左：对话是线性、一次性的流；右：画布是可回改、可动手的表面</title>
      <line x1="410" y1="30" x2="410" y2="270" stroke="var(--d-faint)" stroke-width="1.4" stroke-dasharray="3 6"/>
      <!-- LEFT: chat stream -->
      <g>
        <rect x="60" y="34" width="250" height="42" rx="8" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.4" opacity="0.5"/>
        <rect x="60" y="96" width="250" height="42" rx="8" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.4" opacity="0.75"/>
        <rect x="60" y="158" width="250" height="42" rx="8" fill="var(--d-fill)" stroke="var(--d-old)" stroke-width="1.5"/>
        <line x1="120" y1="179" x2="270" y2="179" stroke="var(--d-ink)" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
        <line x1="40" y1="46" x2="40" y2="196" stroke="var(--d-old)" stroke-width="1.5"/>
        <path d="M40 200 l-5 -9 h10 z" fill="var(--d-old)"/>
        <text x="185" y="250" text-anchor="middle" font-family="var(--sans)" font-size="15" fill="var(--d-ink)">对话流 · 只能向前追加</text>
        <text x="185" y="273" text-anchor="middle" font-family="var(--sans)" font-size="12.5" fill="var(--d-old)">改一个词 → 只能整段重说</text>
      </g>
      <!-- RIGHT: canvas panel -->
      <g>
        <rect x="470" y="42" width="290" height="176" rx="10" fill="var(--d-fill)" stroke="var(--d-accent)" stroke-width="1.8"/>
        <line x1="496" y1="78" x2="720" y2="78" stroke="var(--d-ink)" stroke-width="5" stroke-linecap="round" opacity="0.35"/>
        <rect x="492" y="100" width="200" height="15" fill="var(--d-mark)"/>
        <line x1="496" y1="108" x2="686" y2="108" stroke="var(--d-ink)" stroke-width="4.5" stroke-linecap="round" opacity="0.6"/>
        <line x1="496" y1="136" x2="700" y2="136" stroke="var(--d-ink)" stroke-width="5" stroke-linecap="round" opacity="0.35"/>
        <line x1="496" y1="160" x2="640" y2="160" stroke="var(--d-ink)" stroke-width="5" stroke-linecap="round" opacity="0.35"/>
        <g fill="var(--d-fill)" stroke="var(--d-accent)" stroke-width="1.6">
          <rect x="465" y="37" width="9" height="9"/>
          <rect x="756" y="37" width="9" height="9"/>
          <rect x="465" y="213" width="9" height="9"/>
          <rect x="756" y="213" width="9" height="9"/>
        </g>
        <path d="M700 150 l0 26 l7 -7 l5 11 l5 -2 l-5 -11 l10 0 z" fill="var(--d-accent)"/>
        <text x="615" y="250" text-anchor="middle" font-family="var(--sans)" font-size="15" fill="var(--d-ink)">画布 · 一件能继续动手的产物</text>
        <text x="615" y="273" text-anchor="middle" font-family="var(--sans)" font-size="12.5" fill="var(--d-accent)">选中那一行，直接改</text>
      </g>
    </svg>
</div>
<figcaption>同一个答案，两种界面：左边只能看，右边是可以进行交互的。</figcaption>
</figure>

## 一、对话不是终点

我们让 AI 写封邮件、做张表、起一份候选人画像，它能做得很好。然而想改一个词的时候，却没法把鼠标移过去直接修改，只能再打一句话："把第二段的语气改客气点。"让它重新生成一整段，然后再对比、再修改，来回折腾，费时费力。

这其实并不是模型不够聪明，而是我们的界面形态错了。纯对话框有四个天生的短板：

- **线性**：对话是一条只能往前追加的流，但我们想改的东西，应该是一个能回退、能定点修改的状态。
- **一次性**：每一轮 Artifact 的产生就沉进了沟通记录中，变成了上下文的一部分，想迭代只能靠再输入一条指令。
- **纯文本**：一封邮件、一张表、一个能点的小应用，被压成一段灰扑扑的文字。
- **碰不到**：能看，不能动手。

Canvas 就是各家为了补这四个短板不约而同采取的办法，只要在对话旁边开一块持久、能编辑、还能一起协作的区域，把 AI 的输出从聊天气泡里的一段话，变成一个用户能进行交互的 Artifact，就能解决这些问题。

> **Canvas 并不是要取代对话，而是把人机交互重新带回了 AI 的产品里。**
>
> 对话负责说清用户想要什么，Canvas负责让用户能够在结果上继续修改。

这并不是什么新的 idea。二十多年前，人机交互领域就有过一次大辩论：是让人自己动手，还是把活儿交给 Agent 代劳，最后并没有哪一方获得胜利，而是收敛到一个混合的方案，按需结合（好像很多辩论最后的结果都是这样，笑...）。Canvas 差不多就是人机交互在 AI 时代的样子。这个方案也有具体的实验背书：CHI 2024 的一项研究里，直接操作式的界面在改文字、代码、图形上比纯对话快约一半。

---

## 二、Canvas 的四条支流

Canvas 不是某一家单独发明的，在它的发展历史上有 4 条支线，但是在这几年慢慢汇到了一起。

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 800 260" role="img" aria-labelledby="fig3t">
          <title id="fig3t">四股力量汇流成 Canvas</title>
          <g font-family="var(--sans)" font-size="13.5" fill="var(--d-ink)">
            <text x="20" y="45" opacity="0.9">无限画布</text>
            <text x="20" y="105" opacity="0.9">生成式界面</text>
            <text x="20" y="165" opacity="0.9">协同编辑面</text>
            <text x="20" y="225" opacity="0.9">会话状态</text>
          </g>
          <g fill="none" stroke="var(--d-faint)" stroke-width="1.5">
            <path d="M150 40 C360 40, 430 120, 560 128"/>
            <path d="M150 100 C360 100, 440 122, 560 128"/>
            <path d="M150 160 C360 160, 440 134, 560 128"/>
            <path d="M150 220 C360 220, 430 136, 560 128"/>
          </g>
          <circle cx="150" cy="40" r="3.5" fill="var(--d-accent)"/>
          <circle cx="150" cy="100" r="3.5" fill="var(--d-accent)"/>
          <circle cx="150" cy="160" r="3.5" fill="var(--d-accent)"/>
          <circle cx="150" cy="220" r="3.5" fill="var(--d-accent)"/>
          <rect x="560" y="98" width="210" height="62" rx="8" fill="var(--d-accent)"/>
          <text x="665" y="136" text-anchor="middle" font-family="var(--serif)" font-size="21" font-weight="700" fill="var(--d-fill)">Canvas</text>
        </svg>
</div>
<figcaption>四条独立的支线，最后汇成同一种东西。</figcaption>
</figure>

**无限画布**：在一块无边的画布上手绘一个界面草图，按个按钮，模型就把它变成能跑的网页，直接贴回画布上。

**生成式界面**：模型的输出不再是纯文字，而是一块块能实时渲染出来的组件。

**协同编辑面**：在对话旁开一个独立侧栏专门写作和编码，能定点改、也能整体重写。

**会话状态**：把整段工作（不只是这一句问答，而是一路下来的完整过程）渲染成一个能分享的页面。

这四条支线各家都在探索：

| 时间 | 产品 | 说明 |
| --- | --- | --- |
| 2023 · 11 | tldraw Make Real | 手绘草图 → 一键生成可运行网页，贴回画布 |
| 2024 · 03 | Vercel 生成式界面 | 把 AI 的工具调用渲染成实时组件 |
| 2024 · 06 | Claude Artifacts | 对话旁的可编辑产物面（8 月起默认开启并可发布） |
| 2024 · 09 | 微软 Copilot Pages | 一块能多人 + AI 一起实时编辑的持久画布 |
| 2024 · 10 | OpenAI Canvas | 独立侧栏写作/编码面，能定点改也能整体重写 |
| 2025 · 03 | Gemini Canvas | 高亮即改，后来长成能做应用的"创作空间" |
| 2025 · 05 | Perplexity Labs | 把一个提问变成报告、表格、甚至能跑的小应用 |
| 2026 · 06 | Claude Code Artifacts | 把整段工作渲染成可分享的页面 |

*图注：两年多，从"一个侧栏"铺到"整段工作的交付"。*

回顾下，我们发现Agent交付的东西一直在变重：从一个侧栏文档，到多产物的工作台，再到整段工作的可分享交付物。交付物越来越像一个持久的、有结构的、能协作的工作台，而不是单纯的一次性回答了。

---

## 三、Canvas难点不是实现，而是背后的逻辑

我们做个 demo，canvas 很快就能开发出来：在对话旁边弹出一块面板，字和图实时长出来，乍看挺惊艳，看着就像"加个侧栏、把内容渲染一下"。可要做一个生产级产品，这些面上的东西反倒不是最难的，难的全是一些细节：什么时候该弹、让不让用户改、发出去之前要不要先拦一道、七八种完全不同的东西怎么塞进同一套框架。一句话，难的不是怎么去画出 canvas，而是 canvas 背后的逻辑和工程。

### 先对 Canvas 进行一个拆分

Canvas 的变体，其实都落在四条轴上取值：

| 轴 | 一端 | 中间 | 另一端 |
| --- | --- | --- | --- |
| 长在哪里 | 贴在对话里 | 侧栏 · 全屏 | 无限画布 |
| 能改到什么程度 | 只能看 | 能编辑 | 能多人协同 |
| 有几件产物 | 就地改文档 | 单个产物 | 多产物工作台 |
| 谁决定它出现 | 用户点开 | — | 模型自己判断 |

*图注：这些产品，其实是同一个空间里的不同取点。*

每条轴后面都藏着要反复掂量的取舍：**什么时候弹出来**（早了打断话头，晚了已经在会话气泡里看完）、**改的时候是只改选中的那句，还是整段重写**、**要不要做版本化，改错了可以回退**、**发出去前要不要有用户确认**。这些都没有通用答案，最终还是要看这块 Canvas 到底在替"谁"、做"什么"。

### 对于一个能运行的Artifact怎么框定边界

有一类 Canvas 比较大胆：Artifact 本身就是一个能直接跑起来的小应用，而不只是一份能看、能改的文档。这时候关键问题就来了：我们怎么控制它的边界。

拿 Claude 的 Artifacts 举例。里头的小应用可以自己调用大模型，但被关在一个很严的沙盒里：不能连外网、不能存数据、只能跟大模型对话。当然有个好处，Artifact 内使用模型的费用不需要建造者出，而是使用者出。**这个沙盒的边界特别重要，决定了它能干什么、钱由谁出、安不安全。**

### 我们的方案：一套框架，而不是一个编辑器

市面上的 canvas，说白了就是个内置编辑器，围着"内容"转——文档、代码、网页。我们走了另一条路：把它做成一套面向能力的框架。

怎么做呢？其实就是针对于：邮件草稿、确认、澄清表单、候选人画像、浏览器自动化里的人工确认、插件门禁、文件查看……这些不同的东西，在我们这儿共用同一套框架、同一套生命周期流程。想扩展一个画布只需两步：第一步，填一张配置表（十几个配置项，说清这东西长什么样、能不能改、发出前要不要人确认、来了新的旧的怎么办），第二步，再写一段只需要管理 UI、不需要碰状态的界面渲染代码。剩下的——什么时候展开、收起、放大，改了没存怎么提醒，做完怎么收尾，全部交给框架。

如果打个比方的话：大部分的人的做法是打造一支更顺手的笔，我们做的是一套模板加流水线，只需要负责填空，装订、排版、盖章框架自己搞定。

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 800 234" role="img" aria-labelledby="fighub">
          <title id="fighub">一套框架，七种能力共用</title>
          <g fill="none" stroke="var(--d-faint)" stroke-width="1.4">
            <path d="M170 40 C245 40 245 116 300 116"/>
            <path d="M170 93 C245 93 250 124 300 124"/>
            <path d="M170 146 C245 146 250 132 300 132"/>
            <path d="M170 199 C245 199 245 140 300 140"/>
            <path d="M630 60 C555 60 555 120 500 120"/>
            <path d="M630 123 C555 123 555 127 500 127"/>
            <path d="M630 186 C555 186 555 134 500 134"/>
          </g>
          <g font-family="var(--sans)" font-size="13" fill="var(--d-ink)">
            <g>
              <rect x="30" y="25" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="100" y="45" text-anchor="middle">邮件草稿</text>
              <rect x="30" y="78" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="100" y="98" text-anchor="middle">确认卡</text>
              <rect x="30" y="131" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="100" y="151" text-anchor="middle">澄清表单</text>
              <rect x="30" y="184" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="100" y="204" text-anchor="middle">候选人画像</text>
              <rect x="630" y="45" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="700" y="65" text-anchor="middle">浏览器确认</text>
              <rect x="630" y="108" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="700" y="128" text-anchor="middle">插件门禁</text>
              <rect x="630" y="171" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="700" y="191" text-anchor="middle">文件查看</text>
            </g>
            <rect x="300" y="95" width="200" height="64" rx="10" fill="var(--d-accent)"/>
            <text x="400" y="124" text-anchor="middle" fill="var(--d-fill)" font-size="16" font-weight="700">一套框架</text>
            <text x="400" y="146" text-anchor="middle" fill="var(--d-fill)" font-size="11" opacity="0.9">外壳 · 生命周期 · 状态</text>
          </g>
        </svg>
</div>
<figcaption>七种毫不相干的能力，共用同一套外壳与状态机；接入方只填配置、写渲染器。</figcaption>
</figure>

也有个麻烦点就是屏幕空间有限，一次只摆得下一个产物；放大一个，上一个就得自动缩回去。

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 800 210" role="img" aria-labelledby="fig4t">
          <title id="fig4t">打开一个，其它自动收起</title>
          <g font-family="var(--sans)" font-size="12.5">
            <text x="150" y="26" text-anchor="middle" fill="var(--d-old)">两件同时占位 → 会错乱</text>
            <rect x="60" y="42" width="86" height="120" rx="8" fill="var(--d-fill)" stroke="var(--d-old)" stroke-width="1.5"/>
            <rect x="158" y="42" width="86" height="120" rx="8" fill="var(--d-fill)" stroke="var(--d-old)" stroke-width="1.5"/>
            <path d="M74 62 h60 M74 80 h48 M172 62 h60 M172 80 h48" stroke="var(--d-ink)" stroke-width="3.5" stroke-linecap="round" opacity="0.35"/>
            <path d="M300 102 h74" stroke="var(--d-ink)" stroke-width="1.5"/>
            <path d="M378 102 l-10 -5 v10 z" fill="var(--d-ink)"/>
            <text x="600" y="26" text-anchor="middle" fill="var(--d-accent)">一个占位，其它收成小条</text>
            <rect x="470" y="42" width="150" height="120" rx="8" fill="var(--d-fill)" stroke="var(--d-accent)" stroke-width="1.8"/>
            <path d="M486 66 h118 M486 88 h96 M486 110 h110" stroke="var(--d-ink)" stroke-width="3.5" stroke-linecap="round" opacity="0.4"/>
            <rect x="636" y="42" width="104" height="24" rx="6" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/>
            <rect x="636" y="74" width="104" height="24" rx="6" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/>
          </g>
        </svg>
</div>
<figcaption>"同屏只留一件"这条规矩跨所有能力统一管——早先按类型各管各的，两件同时占位，界面就会错乱。</figcaption>
</figure>

### 配置的背后就是业务逻辑

我们框架的核心，是在那张配置表里。同一份配置，七个能力填出了七份不一样的答案，而每一处不一样，都是一个业务判断，不是技术选择。

| 能力 | 新的来了，旧的怎么办 | 能不能改 | 一处业务判断 |
| --- | --- | --- | --- |
| 邮件草稿 | 收走旧的 | 可编辑 | 发完一封才起下一封，本就不会并存 |
| 确认卡 | 多张并存 | 只读 | 每张是独立的短交互，折叠了就成一条空壳 |
| 澄清表单 | 并存 | 可编辑 | 提交后保持展开，方便回看自己填了什么 |
| 插件门禁 | 收走旧的 | 随状态自适应 | 故意不给"展开"键，防"能展开却收不回" |
| 文件查看 | —— | 只读 | 没有对应工具，点击时才程序化打开 |

什么时候折叠、要不要并存、发出前谁点头、旧的怎么办，全是业务逻辑：怎样才算把一件事交付对了。通用的编辑器只能替你画出一个界面，做不了这些逻辑判断。

### 高敏感动作需要用户确认

市面上大部分的 canvas 不"执行"任何东西，它就是个文档，改完下载就行。但是我们的Canvas会真的发邮件、真的驱动浏览器去点一个按钮。于是就会多出一个别家没有的问题：这件事交出去之前，要不要先让用户确认？在我们的框架里，这是配置里的一类：直接执行、先做一次确认，或者干脆阻塞等用户补充。它绑定的不是"渲染"，而是 agent 真的会去做事这件事。

还有些实际的坑，框架都预置了一些护栏。比如：一个能力可以编辑，却既没有放大的地方、手机上又不能就地改——用户就会"看得见，改不了"。这种组合，人在写代码时很难一眼看出来，框架会在上线前就把它拦下、直接报错。

---

## 四、Canvas 的发展趋势

Canvas 已经是各家标配了，能力在飞快趋同。侧栏、可编辑、协同、能跑的 Artifact，这两年基本上是各家的标配了。外壳越来越像。

而且有明显的被平台吸收的迹象：Gemini 的 Canvas 已经从一个独立功能，被并进了 Google 搜索的 AI 模式里。触发逻辑也在下沉，OpenAI 曾公开讲过它怎么训练模型判断"什么时候该开一个画布"（拿更强模型蒸馏出的合成数据去训）。所以渲染的外壳、以及"要不要开画布"这类通用触发，也在往模型和平台那一层沉。

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 800 250" role="img" aria-labelledby="fig5t">
          <title id="fig5t">壳和触发会被平台吸收，业务判据留得下</title>
          <g font-family="var(--sans)" font-size="14">
            <rect x="150" y="28" width="500" height="44" rx="6" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/>
            <text x="400" y="55" text-anchor="middle" fill="var(--d-ink)" opacity="0.75">渲染的壳（侧栏 / 全屏 / 画布）</text>
            <rect x="150" y="82" width="500" height="44" rx="6" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/>
            <text x="400" y="109" text-anchor="middle" fill="var(--d-ink)" opacity="0.75">通用触发：要不要开画布</text>
            <g stroke="var(--d-faint)" stroke-width="1.5">
              <path d="M690 92 v-50"/><path d="M690 42 l-5 10 h10 z" fill="var(--d-faint)" stroke="none"/>
            </g>
            <text x="714" y="70" font-size="11.5" fill="var(--d-faint)" transform="rotate(90 714 70)">被平台吸收</text>
            <rect x="150" y="150" width="500" height="62" rx="8" fill="var(--d-accent)"/>
            <text x="400" y="179" text-anchor="middle" fill="var(--d-fill)" font-size="15" font-weight="700">业务交付语义</text>
            <text x="400" y="200" text-anchor="middle" fill="var(--d-fill)" font-size="12" opacity="0.92">什么产物 · 何时交给人 · 什么算做对 · 谁来确认</text>
            <text x="400" y="236" text-anchor="middle" font-size="12" fill="var(--d-accent)">扎在业务里 · 护城河</text>
          </g>
        </svg>
</div>
<figcaption>上面两层往平台沉，最下面一层跟业务强相关，平台无法解决。</figcaption>
</figure>


框架能力决定能交付成什么样子，而对业务的理解，决定它交付得对不对。

## 参考

**产品**：OpenAI Canvas · Claude Artifacts · Gemini Canvas · Vercel 生成式界面 · 微软 Copilot Pages · Perplexity Labs · Cursor · Figma First Draft · tldraw Make Real

**思想来源**

- Horvitz · [Principles of Mixed-Initiative User Interfaces（CHI 1999）](http://erichorvitz.com/uiact.htm)
- Maes–Shneiderman · [直接操作 vs 智能体之争（CHI 1997）](https://www.cs.umd.edu/~ben/papers/Maes1997Intelligent.pdf)
- Ink & Switch · [Malleable Software](https://www.inkandswitch.com/essay/malleable-software/)
- DirectGPT · [CHI 2024](https://arxiv.org/abs/2310.03691)
