---
title: Iced 学习第一天：pane_grid 交互流程
slug: iced-xue-xi-di-yi-tian-pane_grid-jiao-hu-liu-cheng-z5oeaq
url: /post/iced-xue-xi-di-yi-tian-pane_grid-jiao-hu-liu-cheng-z5oeaq.html
date: '2026-08-11 23:55:59+08:00'
lastmod: '2026-08-12 00:18:03+08:00'
toc: true
isCJKLanguage: true
---



# Iced 学习第一天：pane_grid 交互流程

　　‍

　　本文记录学习 **Iced**（Rust 的声明式 GUI 框架）第一天的收获，主题是 `pane_grid`​ 的交互流程。贯穿全文的一条主线：**UI 不是被直接操作的，而是由 State 驱动、在每次交互后重新生成的**。

　　按「三个概念 → 布局模型 → UI 生成 → 交互流程 → 总结」的顺序展开，主要回答这几个问题：

- 文章里到底有几个 `Pane`？—— 三个都叫 "Pane" 的概念怎么区分？
- 一个 `State<Pane>` 为什么能管理多个 Pane？—— 布局树如何组织？
- 拖拽分隔条后发生了什么？—— `ResizeEvent`​ 如何一步步传到 `update()`？
- `view()` 里的闭包为什么执行多次？—— 每个 Pane 都会被调用一次。

---

## 一、分清三个 `Pane`

　　刚开始学 `pane_grid`​，最大的坑就是：示例代码里出现了三个都叫  **"Pane"**  的东西，写法相似、职责完全不同。

```
① 你自己的 enum Pane —— 业务数据："这个 Pane 是什么"
② pane_grid::Pane    —— ID / 句柄："它是第几个 Pane"
③ State<Pane>        —— 布局状态："整个布局长什么样"
```

### 1.1 你自己的 `enum Pane` —— 业务数据

　　最开始容易误解：

```rust
enum Pane {
    MainPane,
    SidePane,
}
```

　　它**并不是一个真正的 GUI 控件**，它只是**每个 Pane 中保存的业务数据类型**。

　　例如：

```rust
enum Pane {
    Editor,
    Terminal,
    FileExplorer,
}
```

　　那么它表达的是：

```
这个 Pane 是 Editor
这个 Pane 是 Terminal
这个 Pane 是 FileExplorer
```

　　它本身不负责：

- resize
- layout
- split
- rendering

　　因此 `Pane::MainPane`​ 没有 `resize()` 方法完全正常——它只是一份数据，不是控件。

### 1.2 `pane_grid::Pane` —— ID（句柄）

　　这是 Iced 内部用来标识布局树中某个 Pane 的 **ID**。它的实现非常简单：

```rust
pub struct Pane(u64);   // 内部就是一个编号
```

　　它不保存任何业务数据，只回答一个问题： **"你是第几个 Pane？"**  比如第一个 Pane 的 ID 就是 `0`​（`Pane(0)`）。

　　之所以要把 ID 交给你，是因为之后所有操作都要凭 ID 指定"操作哪个 Pane"：

```rust
// 在 main 上切一刀，生成 SidePane
let (split, side_pane) = panes.split(
    pane_grid::Axis::Vertical,
    main,               // ← 传入 ID
    Pane::SidePane,     // ← 新 Pane 的业务数据
);
```

### 1.3 `pane_grid::State<Pane>` —— 布局状态

　　真正负责维护 PaneGrid 布局的是 `pane_grid::State<Pane>`​，可以把它理解成 **PaneGrid 的状态模型 / 布局树**。

　　例如：

```
State<Pane>
    │
    ▼
  Split
 /     \
Pane   Pane
 │       │
Main    Side
```

　　它维护的信息包括：

- 当前有哪些 Pane
- Pane 之间如何组织
- 哪些 Pane 被 Split
- Split 的方向
- Split 的 ratio
- Pane 的布局关系
- Pane 的 ID

　　所以可以粗略类比：

```
State<Pane>
    ≈
控件的内部状态 + 布局模型
```

　　但不要严格把它当成"实际绘制出来的控件"，真正产生 UI 的是 `pane_grid(&self.panes, ...)`。

### 1.4 源码实锤：`State::new` 里两个 Pane 同时出现

　　如果还分不清前两个 Pane，直接看 `State::new` 的完整源码就清楚了：

```rust
pub fn new(first_pane_state: T) -> (Self, Pane) {
    (
        Self::with_configuration(Configuration::Pane(first_pane_state)),
        Pane(0),
    )
}
```

　　这个函数里**同时出现了两个不同的 Pane**：

- `first_pane_state: T`​ —— 参数，就是你的 `enum Pane`​（业务数据），会被存进布局树的叶子节点 `Configuration::Pane(...)` 里
- `Pane(0)`​ —— 返回值，是 `pane_grid::Pane`​（Iced 内部的 ID / 句柄），`0` 只是编号，不携带任何业务数据

　　所以写 `State::new(Pane::MainPane)` 时两个 Pane 写法相同、含义却不同：

```
State::new(Pane::MainPane)
        │            │
        │            └── ① 你的 enum Pane（业务数据）→ 存进 State 内部
        │
        └── 返回 Pane(0) → ② pane_grid::Pane（ID）→ 留给你以后操作它用
```

　　而 `let (mut panes, main) = State::new(Pane::MainPane)`​ 中：`panes`​ 是布局状态，`main` 是 ID。

　　一句话：**​`State::new`​**​ **收的是"数据"（你的 enum），还给你的却是"ID"（**​**​`pane_grid::Pane`​**​ **）。**

### 1.5 记忆口诀

```
你的 Pane
    ↓
"我是谁？"

pane_grid::Pane
    ↓
"我的 ID 是什么？"

State<Pane>
    ↓
"整个布局是什么样？"
```

---

## 二、布局模型：State、Split 与布局树

### 2.1 为什么一个 `State<Pane>` 能拥有多个 Pane？

　　刚开始：

```rust
let (panes, _) =
    pane_grid::State::new(Pane::MainPane);
```

　　得到：

```
State
└── MainPane
```

　　因此只有一个 Pane。如果想增加第二个 Pane：

```rust
let (mut panes, main) =
    pane_grid::State::new(Pane::MainPane);

panes.split(
    pane_grid::Axis::Vertical,
    main,
    Pane::SidePane,
);
```

　　结果：

```
             State
               │
             Split
            /     \
           /       \
       MainPane   SidePane
```

　　视觉上：

```
┌────────────────────┬────────────────────┐
│                    │                    │
│       Main         │        Side        │
│                    │                    │
└────────────────────┴────────────────────┘
```

　　所以不是：

```
State<Pane>
State<Pane>
```

　　而是：

```
State<Pane>
```

　　一个 State 内部维护多个 Pane。

### 2.2 `Split` 是什么？—— 理解 resize 的关键

　　这是理解 resize 的关键：**Pane 本身不能 resize。**  真正被拖动的是两个 Pane 之间的 `Split`。

　　例如：

```
┌──────────────────┬──────────────────┐
│                  │                  │
│      Pane A      │      Pane B      │
│                  │                  │
└──────────────────┴──────────────────┘
                   ↑
                 Split
```

　　用户拖动：

```
                 ←────→
┌──────────────────┼──────────────────┐
                   ↑
                 Split
```

　　改变的是 Split 的位置。例如 `ratio = 0.5`​ 变成 `50% | 50%`​；拖动之后 `ratio = 0.3`​ 变成 `30% | 70%`。

　　因此：

```rust
self.panes.resize(
    event.split,
    event.ratio,
);
```

　　真正的含义是：**修改某个 Split 的 ratio**，而不是"找到某个 Pane，然后调用 Pane 的 resize"。

### 2.3 `pane_grid` 的布局本质上是一棵树

　　例如三个 Pane：

```
              Split
             /     \
          Main      Split
                   /     \
                Editor  Terminal
```

　　对应 UI：

```
┌────────────────────┬────────────────────┐
│                    │                    │
│                    │      Editor        │
│       Main         │                    │
│                    ├────────────────────┤
│                    │                    │
│                    │      Terminal      │
│                    │                    │
└────────────────────┴────────────────────┘
```

　　所以 `State<Pane>`​ 更准确地说，是**维护了一棵 Pane/Split 布局树**。这也是为什么 `resize()`​ 属于 `State`——因为：

```
Pane
  ↓
只知道自己是什么

State
  ↓
知道 Pane 之间怎么组织
  ↓
知道 Split 在哪里
  ↓
知道 Split 的 ratio
```

---

## 三、view()：状态如何生成 UI

### 3.1 闭包为什么会执行多次？

　　代码：

```rust
fn view(&self) -> Element<'_, Message> {
    pane_grid(&self.panes, |_pane, state, _is_maximized| {
        pane_grid::Content::new(
            match state {
                Pane::MainPane => text("Main"),
                Pane::SidePane => text("Side"),
            }
        )
    })
    .into()
}
```

　　这里的闭包不是只处理一个 Pane，而是 **PaneGrid 遍历当前 State 中的每一个 Pane 时，分别调用这个闭包**。

　　例如：

```
State
├── MainPane
└── SidePane
```

　　那么大致可以理解成：

```
pane_grid(...)
    │
    ├── 调用闭包(MainPane)
    │      ↓
    │   Content("Main")
    │
    └── 调用闭包(SidePane)
           ↓
        Content("Side")
```

　　最终 PaneGrid 根据布局树同时显示两个 Pane。所以**后一个 Pane 不会覆盖前一个 Pane**，因为闭包是"针对每一个 Pane 分别生成 Content"。

### 3.2 三个参数：`pane`​ / `state`​ / `is_maximized`

```rust
pane_grid(&self.panes, |pane, state, is_maximized| {
```

　　三个参数可以理解成：

```
pane
 ↓
Iced 内部的 Pane ID（② pane_grid::Pane）

state
 ↓
你放进 State 的 Pane 数据（① 你的 enum Pane）

is_maximized
 ↓
当前 Pane 是否最大化
```

　　例如：

```
Pane ID 1 → Pane::MainPane
Pane ID 2 → Pane::SidePane
```

　　遍历时：

```
第一次：

pane  = Pane ID 1
state = Pane::MainPane

第二次：

pane  = Pane ID 2
state = Pane::SidePane
```

　　所以：

```rust
match state {
    Pane::MainPane => text("Main"),
    Pane::SidePane => text("Side"),
}
```

　　是在决定：**当前这个 Pane 应该显示什么内容。**

---

## 四、Resize 交互流程

### 4.1 完整流程：从鼠标到 Message

　　首先：

```rust
pane_grid(...)
    .on_resize(10, Message::PaneResized)
```

　　这里告诉 PaneGrid：**如果用户拖动 Split，就把 resize 事件转换成** **​`Message::PaneResized`​**​ **。**

　　用户拖动分隔条后，PaneGrid 内部检测到"哪个 Split？新的 ratio 是多少？"，然后生成：

```
ResizeEvent {
    split: ...,
    ratio: 0.35,
}
```

　　再通过 `Message::PaneResized(event)` 交给应用。

### 4.2 `ResizeEvent` 是谁创建的？

　　**不是用户创建，也不是我们创建，是** **​`PaneGrid`​**​ **内部产生的。**

　　我们只声明：

```rust
enum Message {
    PaneResized(pane_grid::ResizeEvent),
}
```

　　意思是：我的应用允许收到一个携带 `ResizeEvent` 的 Message。

　　然后：

```rust
.on_resize(10, Message::PaneResized)
```

　　相当于告诉 Iced：当你产生 `ResizeEvent`​ 时，请使用 `Message::PaneResized` 把它包装成我的 Message。

　　因此：

```
PaneGrid
   │
   │ 创建
   ▼
ResizeEvent
   │
   │ 包装
   ▼
Message::PaneResized(event)
   │
   ▼
update(message)
```

### 4.3 `event`​ 为什么可以直接出现在 `match` 里？

　　这是 Rust 模式匹配：

```rust
match message {
    Message::PaneResized(event) => {
        ...
    }
}
```

　　这里的 `event`​ 只是把 `Message::PaneResized` 中携带的值绑定到一个局部变量。类似：

```rust
enum Message {
    Hello(String),
}

match message {
    Message::Hello(value) => {
        println!("{}", value);
    }
}
```

　　所以 `Message::PaneResized(event)`​ 中的 `event`​ 就是 `pane_grid::ResizeEvent`。

### 4.4 `update()` 最终修改 State

　　收到 `Message::PaneResized(event)` 之后：

```rust
match message {
    Message::PaneResized(event) => {
        self.panes.resize(
            event.split,
            event.ratio,
        );
    }
}
```

　　`event.split`​ 告诉 State **修改哪一个 Split**；`event.ratio`​ 告诉 State **修改成什么比例**。

　　例如：

```
原来：

┌──────────────┼──────────────────────┐
     30%                  70%

拖动后：

┌────────────────────┼────────────────┐
          60%                 40%
```

　　本质上就是：

```
Split
  ratio: 0.3
      ↓
Split
  ratio: 0.6
```

### 4.5 我自己的理解（对照修正）

　　我当时是这样理解的：

> 当我用鼠标触发 resize 事件，pane_grid 会自动生成一个 `Message::ResizePane(event)`​，其中 event 是具体的 resize 数据，然后系统将这个 msg 推送给 update，update 通过 `self.panes` 找到当前的 pane，并调用他的 resize 方法调整实际的 pane 大小。

　　这个理解大方向对，但有三处细节要修正：

|我的原话|更准确的说法|
| --------------------------------------------------------| ----------------------------------------------------------------------------------------------------------------------------|
|自动生成一个 `Message::ResizePane(event)`|生成的是 **​`ResizeEvent`​**​，再经由 `.on_resize(10, Message::PaneResized)`​ 这个回调**映射**成 `Message::PaneResized(event)`​（注意是 `PaneResized`​，不是 `ResizePane`）|
|系统将这个 msg 推送给 update|是 Iced 的事件循环把 Message 交给 `update()`（Elm 架构的一部分），不是"系统自动"|
|update 通过 `self.panes` 找到当前的 pane，并调用他的 resize 方法|`self.panes`​ 里**没有"当前的 Pane"** ——`resize()`​ 收到的是 `event.split`​（哪个 Split）+ `event.ratio`​（什么比例），修改的是 **Split 的 ratio**，而不是"某个 Pane 的 resize 方法"；Pane 本身没有 resize|

　　最后一点恰恰是第 2 章强调过的：**拖的不是 Pane，是 Split；改的不是 Pane，是 ratio。**

　　完整链条（修正版）：

```
鼠标拖动 Split
   ↓
PaneGrid 内部检测 → 生成 ResizeEvent { split, ratio }
   ↓
.on_resize(10, Message::PaneResized) 包装成 Message
   ↓
Iced 事件循环 → update(Message::PaneResized(event))
   ↓
self.panes.resize(event.split, event.ratio)   // 修改 Split 的 ratio
   ↓
State 变化 → view() 重新生成 UI
```

### 4.6 为什么修改 State 后 UI 会变化？

　　这是 Iced 的核心思想：

```
State
  ↓
View(State)
  ↓
UI
```

　　所以：

```
用户操作
   ↓
Message
   ↓
update()
   ↓
修改 State
   ↓
view()
   ↓
PaneGrid 重新根据 State 构建 UI
```

　　例如 `ratio = 0.3`：

```
┌───────────┬─────────────────────────┐
│   Main    │          Side           │
│   30%     │          70%            │
└───────────┴─────────────────────────┘
```

　　修改为 `ratio = 0.6`：

```
┌────────────────────┬────────────────┐
│       Main         │      Side      │
│        60%         │       40%      │
└────────────────────┴────────────────┘
```

　　所以我们没有直接操作"屏幕上的 Pane"，而是：**修改状态 → 根据新状态重新生成 UI。**

---

## 五、总结

### 5.1 最终关系图

　　这是今天最值得保存的一张图：

```
                         ┌───────────────┐
                         │     User      │
                         │  鼠标拖 Split │
                         └───────┬───────┘
                                 │
                                 ▼
                         ┌───────────────┐
                         │   PaneGrid    │
                         │  捕获鼠标事件 │
                         └───────┬───────┘
                                 │
                                 │ 创建
                                 ▼
                         ┌───────────────┐
                         │ ResizeEvent   │
                         │               │
                         │ split         │
                         │ ratio         │
                         └───────┬───────┘
                                 │
                                 │
                                 ▼
                   Message::PaneResized(event)
                                 │
                                 ▼
                         ┌───────────────┐
                         │    update()   │
                         └───────┬───────┘
                                 │
                                 │ 修改
                                 ▼
                    ┌──────────────────────┐
                    │ pane_grid::State<Pane>│
                    │                      │
                    │       Split          │
                    │      /     \         │
                    │    Pane    Pane      │
                    │     │       │        │
                    │   Main    Side       │
                    │                      │
                    │   ratio = 0.3 → 0.6  │
                    └──────────┬───────────┘
                               │
                               │
                               ▼
                            view()
                               │
                               ▼
                    ┌──────────────────────┐
                    │     pane_grid()      │
                    │                      │
                    │  遍历每一个 Pane     │
                    │       ↓              │
                    │  多次调用闭包        │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
              Content(Main)        Content(Side)
                    │                     │
                    └──────────┬──────────┘
                               ▼
                          Renderer
                               │
                               ▼
                           屏幕 UI
```

### 5.2 一句话记忆

　　如果以后忘了，可以只记这句话：

> **​`Pane`​**​ **决定"显示什么"，**​**​`State<Pane>`​** ​ **决定"怎么布局"，**​**​`Split`​**​ **决定"怎么分割"，**​**​`ResizeEvent`​**​ **描述"用户拖成什么样"，**​**​`Message`​**​ **把事件带进应用，**​**​`update()`​** ​ **修改 State，**​**​`view()`​** ​ **再根据新的 State 生成 UI。**

　　最终形成：

```
用户
 ↓
Event
 ↓
Message
 ↓
update
 ↓
State
 ↓
view
 ↓
UI
```

　　这就是今天通过 `pane_grid`​ 实际理解到的 **Iced 的状态驱动 GUI 模型**。

　　‍
