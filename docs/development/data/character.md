# 定义角色和角色技能

## `character` 角色

角色定义基本是固定的内容：

```ts
const Ganyu = character(1101)   // 角色 ID
  .tags("cryo", "bow", "liyue") // 角色标签，通常必须包含元素、武器、国籍
  .health(10)                   // 最大生命值
  .energy(3)                    // 最大能量值
  .skills(...)                  // 主动和被动技能，由 `skill` 定义
  .done();
```

## `skill` 角色技能

### 主动技能

主动技能的定义方法包括：

- `.costXxx` 指定使用技能消耗的骰子。
- `.type` 指定技能类型，可为 `"normal"` `"elemental"` 或 `"burst"`。
- `.noEnergy()` 指定使用此技能不自动积累能量。

随后的描述方式参见[操作描述](./operations.md)。

### 被动技能

被动技能实际上是角色作为实体的表现。在 `skill` builder chain 中调用 `.type("passive")`，随后的描述被转换为 [caller](./operations.md#caller) 类型为 `"character"` 的实体操作描述。

例：

```ts
/** 枫原万叶 千早振 被动 */
const ChihayaburuPassive = skill(15054)
  .type("passive")
  .on("skill", (c) => c.eventArg.definition.id === Chihayaburu)
  .switchActive("my next")
  .done();
```
