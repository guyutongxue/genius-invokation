# 数据描述（通用部分）

## 全局操作语境

所有的事件响应器都继承自全局操作语境 `Context`，包括如下接口：

- `dealDamage`：造成伤害
- `gainEnergy`：充能（普攻和战技自动完成）
- `createStatus`：生成状态
- `createCombatStatus`：生成出战状态
- `createSupport`：生成支援
- `summon`：召唤召唤物
- `generateDice`：生成骰子
- `drawCards`：从牌堆抽取手牌
- `createCards`：生成手牌（刻晴战技）
- `switchCards`：重抽手牌（草与智慧）
- `switchActive`：切换出战角色
- `useSkill`：使用出战角色的技能
- `flipNextTurn`：强制修改行动轮轮转（风与自由）
- `dispose`：（状态、支援、召唤物）弃置

## 目标选择器

对于 `dealDamage` `heal` `createStatus` `switchActive` 等操作，需要指定一个或多个角色。由于数据描述语境缺乏大量信息（比如角色 ID、角色位置等），所以需要一个更适合数据描述的语法，参见[角色选择器](./selector.md)

**TODO**
