---
title: 'Canvas: the surface an agent delivers on'
description: 'Nearly every AI product of the last two years has added a place beside the chat box where you can edit by hand. The shell gets flattened by the platform; the delivery semantics growing inside it do not.'
pubDate: 2026-07-30
tags: ['Canvas', 'Agent engineering']
---

Agent products have appeared very fast over the last two years, and when people design the interface, nearly all of them put a place next to the chat box where the user can edit by hand.

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 820 300" role="img" aria-labelledby="fig1t">
<title id="fig1t">Left: a conversation is a linear, one-shot stream. Right: a canvas is a surface you can go back into and work on.</title>
<line x1="410" y1="30" x2="410" y2="270" stroke="var(--d-faint)" stroke-width="1.4" stroke-dasharray="3 6"/>
<g>
<rect x="60" y="34" width="250" height="42" rx="8" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.4" opacity="0.5"/>
<rect x="60" y="96" width="250" height="42" rx="8" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.4" opacity="0.75"/>
<rect x="60" y="158" width="250" height="42" rx="8" fill="var(--d-fill)" stroke="var(--d-old)" stroke-width="1.5"/>
<line x1="120" y1="179" x2="270" y2="179" stroke="var(--d-ink)" stroke-width="5" stroke-linecap="round" opacity="0.45"/>
<line x1="40" y1="46" x2="40" y2="196" stroke="var(--d-old)" stroke-width="1.5"/>
<path d="M40 200 l-5 -9 h10 z" fill="var(--d-old)"/>
<text x="185" y="250" text-anchor="middle" font-family="var(--sans)" font-size="15" fill="var(--d-ink)">Chat stream · append-only</text>
<text x="185" y="273" text-anchor="middle" font-family="var(--sans)" font-size="12.5" fill="var(--d-old)">change one word → restate it all</text>
</g>
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
<text x="615" y="250" text-anchor="middle" font-family="var(--sans)" font-size="15" fill="var(--d-ink)">Canvas · something you can work on</text>
<text x="615" y="273" text-anchor="middle" font-family="var(--sans)" font-size="12.5" fill="var(--d-accent)">select the line, edit it</text>
</g>
</svg>
</div>
<figcaption>The same answer, two interfaces: on the left you can only look at it, on the right you can interact with it.</figcaption>
</figure>

## 1. The conversation is not the end

We ask AI to write an email, build a table, draft a candidate profile, and it does the job well. Then you want to change one word — and there is no way to move the cursor over and edit it. You have to type another sentence: "make the second paragraph a bit more polite." It regenerates the whole passage, and you compare and edit again, back and forth, slow and tiring.

This is not really the model being insufficiently smart. Our interface shape is wrong. A plain chat box has four built-in shortcomings:

- **Linear**: a conversation is a stream you can only append to, but the thing you want to change should be a state you can roll back and edit in place.
- **One-shot**: each round's artifact sinks into the transcript as soon as it appears, becoming part of the context, and iterating means typing another instruction.
- **Plain text**: an email, a table, a small clickable app — all flattened into a grey block of prose.
- **Out of reach**: you can look, you cannot touch.

Canvas is what everyone independently arrived at to patch those four. Open a persistent, editable, often collaborative area beside the conversation, turn the AI's output from a paragraph in a chat bubble into an artifact the user can interact with, and the problems go away.

> **Canvas is not out to replace the conversation. It brings human-computer interaction back into AI products.**
>
> The conversation is for saying what the user wants; Canvas is for letting them keep editing the result.

None of this is a new idea. Twenty-odd years ago HCI had a large argument about it: let people do the work themselves, or hand it to an agent. Neither side won; it converged on a hybrid, combine them as needed (most of these debates seem to land there in the end, funnily enough). Canvas is roughly what that looks like in the AI era. There is a concrete experiment behind it too: in a CHI 2024 study, direct-manipulation interfaces were about twice as fast as plain conversation at editing text, code and graphics.

---

## 2. Four tributaries

Canvas was not invented by any one company. Four separate lines run through its history, and they converged over the last few years.

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 800 260" role="img" aria-labelledby="fig2t">
<title id="fig2t">Four forces converging into Canvas</title>
<g font-family="var(--sans)" font-size="13.5" fill="var(--d-ink)">
<text x="20" y="45" opacity="0.9">Infinite canvas</text>
<text x="20" y="105" opacity="0.9">Generative UI</text>
<text x="20" y="165" opacity="0.9">Co-editing pane</text>
<text x="20" y="225" opacity="0.9">Session state</text>
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
<figcaption>Four independent lines, ending up as the same thing.</figcaption>
</figure>

**Infinite canvas**: sketch an interface by hand on a boundless canvas, press a button, and the model turns it into a working web page pasted straight back onto the canvas.

**Generative UI**: the model's output stops being plain text and becomes components rendered live.

**Co-editing pane**: a separate sidebar next to the conversation dedicated to writing and coding, editable in place or rewritable wholesale.

**Session state**: take a whole stretch of work — not one question and answer, but the entire run — and render it as a shareable page.

Everyone has been exploring all four:

| Date | Product | What it did |
| --- | --- | --- |
| 2023 · 11 | tldraw Make Real | hand sketch → one click to a working page, pasted back on the canvas |
| 2024 · 03 | Vercel generative UI | renders the AI's tool calls as live components |
| 2024 · 06 | Claude Artifacts | an editable artifact pane beside the conversation (on by default and publishable from August) |
| 2024 · 09 | Microsoft Copilot Pages | a persistent canvas several people and the AI edit together in real time |
| 2024 · 10 | OpenAI Canvas | a standalone writing/coding sidebar, editable in place or rewritable wholesale |
| 2025 · 03 | Gemini Canvas | highlight to edit, later grew into a "creation space" that can build apps |
| 2025 · 05 | Perplexity Labs | turns one question into a report, a table, even a small running app |
| 2026 · 06 | Claude Code Artifacts | renders a whole stretch of work as a shareable page |

*Caption: over two years, from "one sidebar" to "delivering a whole stretch of work".*

Looking back, what an agent delivers keeps getting heavier: from a sidebar document, to a multi-artifact workbench, to a shareable deliverable covering a whole stretch of work. The deliverable looks less and less like a one-shot answer and more like a persistent, structured, collaborative workbench.

---

## 3. The hard part is not the implementation, it is the logic behind it

For a demo, a canvas comes together quickly: a panel opens beside the conversation, text and graphics grow in it live. It looks impressive at first glance, and it looks like "add a sidebar, render the content". But for a production product, the surface turns out not to be the hard part. The hard part is all in the details: when should it open, do you let the user edit, does something have to intercept before it goes out, how do seven or eight completely different things fit into one framework. The hard part is not drawing the canvas, it is the logic and the engineering behind it.

### Breaking Canvas down first

The variants all come down to picking a value on four axes:

| Axis | One end | Middle | The other end |
| --- | --- | --- | --- |
| Where it lives | inline in the conversation | sidebar · full screen | infinite canvas |
| How far you can edit | read-only | editable | multiplayer |
| How many artifacts | edit the document in place | a single artifact | a multi-artifact workbench |
| Who decides it appears | the user opens it | — | the model judges |

*Caption: these products are different points in the same space.*

Behind each axis is a trade-off you have to weigh repeatedly: **when it opens** (too early interrupts the thought, too late and the user has already read it in the chat bubble), **whether an edit touches only the selected sentence or rewrites the whole thing**, **whether to version it so a bad edit can be rolled back**, **whether the user has to confirm before it goes out**. None of these has a general answer. It comes back to who this canvas is acting for, and what it is doing.

### Where to draw the boundary for a runnable artifact

One kind of Canvas is bolder: the artifact is itself a small app that runs, not just a document you can read and edit. That is when the question arrives — how do we control its boundary.

Take Claude's Artifacts. The small app inside can call the model itself, but it is shut in a strict sandbox: no network, no storage, nothing but talking to the model. There is an upside to that: the model usage inside an artifact is billed to whoever uses it, not to whoever built it. **Where that sandbox boundary sits matters a great deal — it decides what the thing can do, who pays, and whether it is safe.**

### Our approach: a framework, not an editor

The canvases on the market are, bluntly, a built-in editor revolving around "content": documents, code, web pages. We went the other way and made it a framework aimed at capabilities.

How? Email drafts, confirmations, clarification forms, candidate profiles, the human confirmation step inside browser automation, plugin gating, file viewing — all of these different things share one framework and one lifecycle here. Extending a canvas takes two steps. First, fill in a config table (a dozen or so options: what this thing looks like, whether it is editable, whether a human confirms before it goes out, what happens to the old one when a new one arrives). Second, write a chunk of rendering code that only manages UI and never touches state. Everything else — when to expand, collapse or maximise, how to warn about unsaved edits, how to wrap up when it is done — goes to the framework.

To put it as an analogy: most people build a better pen; we built a template plus an assembly line. You fill in the blanks, and the framework handles binding, layout and stamping.

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 800 234" role="img" aria-labelledby="fig3t">
<title id="fig3t">One framework shared by seven capabilities</title>
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
<rect x="30" y="25" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="100" y="45" text-anchor="middle">Email draft</text>
<rect x="30" y="78" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="100" y="98" text-anchor="middle">Confirm card</text>
<rect x="30" y="131" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="100" y="151" text-anchor="middle">Clarify form</text>
<rect x="30" y="184" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="100" y="204" text-anchor="middle">Candidate profile</text>
<rect x="630" y="45" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="700" y="65" text-anchor="middle">Browser confirm</text>
<rect x="630" y="108" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="700" y="128" text-anchor="middle">Plugin gate</text>
<rect x="630" y="171" width="140" height="30" rx="15" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/><text x="700" y="191" text-anchor="middle">File view</text>
</g>
<rect x="300" y="95" width="200" height="64" rx="10" fill="var(--d-accent)"/>
<text x="400" y="124" text-anchor="middle" fill="var(--d-fill)" font-size="16" font-weight="700">One framework</text>
<text x="400" y="146" text-anchor="middle" fill="var(--d-fill)" font-size="11" opacity="0.9">shell · lifecycle · state</text>
</g>
</svg>
</div>
<figcaption>Seven unrelated capabilities sharing one shell and one state machine; the caller only fills in config and writes a renderer.</figcaption>
</figure>

There is an awkward part too: screen space is limited, and only one artifact fits at a time. Maximise one and the previous one has to collapse itself.

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 800 210" role="img" aria-labelledby="fig4t">
<title id="fig4t">Open one and the rest collapse</title>
<g font-family="var(--sans)" font-size="12.5">
<text x="150" y="26" text-anchor="middle" fill="var(--d-old)">two at once → breaks</text>
<rect x="60" y="42" width="86" height="120" rx="8" fill="var(--d-fill)" stroke="var(--d-old)" stroke-width="1.5"/>
<rect x="158" y="42" width="86" height="120" rx="8" fill="var(--d-fill)" stroke="var(--d-old)" stroke-width="1.5"/>
<path d="M74 62 h60 M74 80 h48 M172 62 h60 M172 80 h48" stroke="var(--d-ink)" stroke-width="3.5" stroke-linecap="round" opacity="0.35"/>
<path d="M300 102 h74" stroke="var(--d-ink)" stroke-width="1.5"/>
<path d="M378 102 l-10 -5 v10 z" fill="var(--d-ink)"/>
<text x="600" y="26" text-anchor="middle" fill="var(--d-accent)">one open, the rest collapse</text>
<rect x="470" y="42" width="150" height="120" rx="8" fill="var(--d-fill)" stroke="var(--d-accent)" stroke-width="1.8"/>
<path d="M486 66 h118 M486 88 h96 M486 110 h110" stroke="var(--d-ink)" stroke-width="3.5" stroke-linecap="round" opacity="0.4"/>
<rect x="636" y="42" width="104" height="24" rx="6" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/>
<rect x="636" y="74" width="104" height="24" rx="6" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/>
</g>
</svg>
</div>
<figcaption>"Only one on screen" is enforced across every capability — it used to be handled per type, and two artifacts claiming the space at once would break the layout.</figcaption>
</figure>

### Behind the config is business logic

The core of our framework is in that config table. From the same config, seven capabilities filled in seven different answers — and every difference is a business judgement, not a technical choice.

| Capability | New one arrives, what about the old | Editable | One business judgement |
| --- | --- | --- | --- |
| Email draft | retire the old one | editable | you finish one before starting the next, so they never coexist anyway |
| Confirm card | several coexist | read-only | each is an independent short interaction; collapsed, it becomes an empty shell |
| Clarify form | coexist | editable | stays expanded after submission so you can see what you filled in |
| Plugin gate | retire the old one | adapts to state | deliberately no "expand" button, to prevent "expands but will not collapse" |
| File view | — | read-only | no matching tool; opened programmatically on click |

When to collapse, whether to coexist, who confirms before it goes out, what happens to the old one — all of it is business logic: what counts as having delivered the thing correctly. A general-purpose editor can only draw you an interface. It cannot make these judgements.

### High-stakes actions need user confirmation

Most canvases on the market do not "execute" anything. They are documents; you edit and download. But our Canvas will actually send the email, actually drive the browser to click a button. Which raises a problem nobody else has: before this goes out, should a user confirm it first? In our framework this is one of the config options — execute directly, ask for one confirmation, or block outright and wait for the user. What it binds to is not "rendering", it is the fact that the agent really does go and act.

Some of the practical traps are pre-empted by guardrails in the framework. For instance, a capability is editable but has nowhere to maximise and cannot be edited in place on a phone — the user ends up able to see it and unable to change it. That combination is hard to spot by eye while writing the code, so the framework catches it before release and errors out.

---

## 4. Where Canvas is heading

Canvas is standard equipment now, and the capabilities are converging fast. Sidebar, editable, collaborative, a runnable artifact — over these two years that has become the baseline everywhere. The shells look more and more alike.

There are clear signs of the platform absorbing it, too: Gemini's Canvas has gone from a standalone feature to being folded into Google Search's AI mode. The trigger logic is sinking as well — OpenAI has talked publicly about how it trains the model to judge "when should a canvas open" (on synthetic data distilled from a stronger model). So the rendered shell, and generic triggers like "open a canvas or not", are sinking toward the model and platform layer.

<figure>
<div class="dgm">
<svg class="diagram" viewBox="0 0 800 250" role="img" aria-labelledby="fig5t">
<title id="fig5t">The shell and the trigger get absorbed by the platform; the business criteria stay</title>
<g font-family="var(--sans)" font-size="14">
<rect x="150" y="28" width="500" height="44" rx="6" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/>
<text x="400" y="55" text-anchor="middle" fill="var(--d-ink)" opacity="0.75">The rendered shell (sidebar / full screen / canvas)</text>
<rect x="150" y="82" width="500" height="44" rx="6" fill="var(--d-fill-2)" stroke="var(--d-faint)" stroke-width="1.3"/>
<text x="400" y="109" text-anchor="middle" fill="var(--d-ink)" opacity="0.75">Generic trigger: open a canvas or not</text>
<g stroke="var(--d-faint)" stroke-width="1.5">
<path d="M690 92 v-50"/><path d="M690 42 l-5 10 h10 z" fill="var(--d-faint)" stroke="none"/>
</g>
<text x="714" y="70" font-size="11.5" fill="var(--d-faint)" transform="rotate(90 714 70)">absorbed by the platform</text>
<rect x="150" y="150" width="500" height="62" rx="8" fill="var(--d-accent)"/>
<text x="400" y="179" text-anchor="middle" fill="var(--d-fill)" font-size="15" font-weight="700">Business delivery semantics</text>
<text x="400" y="200" text-anchor="middle" fill="var(--d-fill)" font-size="12" opacity="0.92">which artifact · when to hand off · what counts as right · who confirms</text>
<text x="400" y="236" text-anchor="middle" font-size="12" fill="var(--d-accent)">rooted in the business · the moat</text>
</g>
</svg>
</div>
<figcaption>The top two layers sink toward the platform; the bottom one is tied to the business, and the platform cannot solve it.</figcaption>
</figure>

What the framework can do decides what shape the delivery takes. Understanding the business decides whether the delivery is right.

## References

**Products**: OpenAI Canvas · Claude Artifacts · Gemini Canvas · Vercel generative UI · Microsoft Copilot Pages · Perplexity Labs · Cursor · Figma First Draft · tldraw Make Real

**Sources**

- Horvitz · [Principles of Mixed-Initiative User Interfaces (CHI 1999)](http://erichorvitz.com/uiact.htm)
- Maes–Shneiderman · [direct manipulation vs. interface agents (CHI 1997)](https://www.cs.umd.edu/~ben/papers/Maes1997Intelligent.pdf)
- Ink & Switch · [Malleable Software](https://www.inkandswitch.com/essay/malleable-software/)
- DirectGPT · [CHI 2024](https://arxiv.org/abs/2310.03691)
