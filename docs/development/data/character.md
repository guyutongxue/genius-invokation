# 定义角色和角色技能

## `character` 角色

角色定义基本是固定的内容：

```ts
const Ganyu = character(1101)   // 角色 ID
  .since("v3.3.0")              // 引入游戏版本（见 version.md）
  .tags("cryo", "bow", "liyue") // 角色标签，通常必须包含元素、武器、国籍
  .health(10)                   // 最大生命值
  .energy(3)                    // 最大能量值
  .skills(...)                  // 主动和被动技能，由 `skill` 定义
  .done();
```

`.skills` 中填入主动技能和被动技能，不填入仅能由准备状态触发的技能。

## `skill` 角色技能

### 主动技能

主动技能的定义方法包括：

- `.costXxx` 指定使用技能消耗的骰子。
- `.type` 指定技能类型，可为 `"normal"` `"elemental"` 或 `"burst"`。
- `.noEnergy()` 指定使用此技能不自动积累能量。
- `.enterNightsoul(techEquipment, nightsoulStatus, nightsoulValue)` 为纳塔角色的夜魂性质技能：
  - 该技能无法在装备 `techEquipment` 下打出；
  - 该技能自身装备特技 `techEquipment`，进入 `nightsoulStatus` 指定的夜魂加持，提供 `nightsoulValue` 点夜魂值。
- `.associateExtension`：参见[扩展点](./extensions.md)。

随后的描述方式参见[操作描述](./operations.md)。

### 被动技能

被动技能实际上是角色作为实体的表现。在 `skill` builder chain 中调用 `.type("passive")`，随后的描述被转换为 [caller](./operations.md#caller) 类型为 `"character"` 的实体操作描述。

例：

```ts
/** 枫原万叶 千早振 被动 */
const ChihayaburuPassive = skill(15054)
  .type("passive")
  .on("useSkill", (c, e) => e.action.skill.definition.id === Chihayaburu)
  .switchActive("my next")
  .done();
```
