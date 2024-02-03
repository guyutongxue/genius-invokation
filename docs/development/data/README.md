# 卡牌数据定义

官方卡牌数据均定义于 `@gi-tcg/data` 包；但是定义的方法来自于 `@gi-tcg/core` 的 `builder` 子导出。目前的定义方法是：

```ts
import { beginRegistration, endRegistration } from "@gi-tcg/core/builder";

beginRegistration();

// 所有的数据定义于此

const data = endRegistration();
```

`@gi-tcg/core` 在全局作用域中给出数据定义，最后通过有序的 `import` 插入到注册范围内，最后导出。

在注册范围内调用 `character(...)`、`card(...)` 等方法以提供卡牌的定义。这些方法包括：
- `character` 定义角色牌
- `card` 定义行动牌
- `skill` 定义角色技能
- `status` 定义角色状态
- `combatStatus` 定义出战状态
- `summon` 定义召唤物

> 此外 `equipment` 定义角色装备和 `support` 定义支援区实体，它们不应被直接使用而是在 `card` 的后续链方法中给出。

这些方法是 builder chain——在随后通过 `.foo(...).bar(...)` 的形式给出更进一步的定义，并最终用 `.done();` 结束链，完成定义。一个简单的例子如下：

```ts
/** 运筹帷幄 */
const Strategize = card(332004) // 给出行动牌 id
  .costSame(1)                  // 消耗 1 个同色骰子
  .drawCards(2)                 // 效果：抽两张牌
  .done();                      // 结束定义
```

角色牌、行动牌、实体、技能的 id 应当和官方数据 id 保持一致。如果技术限制无法做到，可以使用小数作为 id，只需确保 `Math.floor(id)` 等于官方数据 id。

`.done()` 会返回 `id` 本身，但是在本文档里称其为“句柄”，并在 TypeScript 中约束为特别的具名类型（如 `character` 的 `.done()` 返回 `CharacterHandle`，而 `.talent` 等方法只接受 `CharacterHandle` 而非 `number`）。如果一个方法期望句柄，但是你只持有 `number` 类型的 `id`（比如是来自[对局状态结构](../state.md)的数据），那么你需要一个 `as` 显式转换，即你自己保证这个 `id` 存在一个合法的定义。

具体每种数据的定义方式参考一下条目：
- [角色牌与角色技能](./character.md)
- [行动牌](./card.md)
- [状态、出战状态和召唤物](./entity.md)

此外，`@gi-tcg/data` 的数据维护工作应参考 [generator](./generator.md)。
