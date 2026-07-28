---
title: 排版参考
description: 这个站会渲染的全部 Markdown 元素集中在一页。保持 draft 状态，不会发布。
pubDate: 2026-07-26
tags: ['参考']
draft: true
---

改完样式之后用来对照检查的样板页。`draft: true` 让它不进生产构建、也不进两个 feed，但在 `pnpm dev`
里照常渲染。

## 标题

只做两级。上面是 `h2`，下面是 `h3`。

### 三级标题

后面跟正文。

## 行内元素

**粗体**、*强调*（中文用字下加点）、`行内代码`、一个[链接](https://astro.build)，以及
~~删除线~~。插入语这种东西放在括号里读起来也没问题（像这样）。

## 列表

- 第一项
- 第二项，写得足够长，好让它折行到第二行，这样就能看出悬挂缩进相对标记符号的对齐效果
- 第三项

1. 有序一
2. 有序二
3. 有序三

## 代码

```ts
export function readingTime(body: string | undefined): number {
  if (!body) return 1
  const cjk = body.match(/[㐀-䶿一-鿿]/g)?.length ?? 0
  const words = body.match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g)?.length ?? 0
  return Math.max(1, Math.round(cjk / 340 + words / 220))
}
```

## 引用

> 引文，起始边加一道朱砂色的竖线。写得长一些，好让第二行的缩进也能一并检查到。

## 表格

| 字段        | 类型    | 说明                  |
| ----------- | ------- | --------------------- |
| `title`     | string  | 必填                  |
| `pubDate`   | date    | 从 YAML 日期强制转换  |
| `draft`     | boolean | 默认为 `false`        |

---

分隔线之后的内容。
