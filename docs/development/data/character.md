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

随后的描述方式参见[操作描述](./operations.md)。


