# 数据描述（通用部分）

## 全局事件

全局事件，即 `Card` 的可用检测器、`Support`、`Summon` 都会监听的事件包括：

- `onActionPhase`：行动阶段开始时；
- `onTurn`：轮到我方行动轮时；
- `onEndPhase`：结束阶段开始时；

- `onUseSkill`：当**我方角色**使用技能后；
- `onBeforeDealDamage`：当**我方**造成伤害前，进行额外结算；
- `onDealDamage`：当**我方**造成伤害后；

- `onBeforeUseDice`：当使用骰子前，进行减费/增费结算；
- `onBeforeSwitchShouldFast`：当切换出战角色前，是否视为快速行动；

- `onDamaged`: 当**我方**角色受到伤害后；
- `onDefeated`：当**我方**角色被击倒后；

上述所有 **我方** 描述可以通过加 `@WithOpp` 修饰，变成可针对双方的描述。**TODO**

## 全局操作语境

所有的事件响应器都继承自全局操作语境 `Context`，包括如下接口：

- `dealDamage`：造成伤害
- `heal`：治疗（造成“治疗”伤害的简便写法）
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

## 目标描述语法

对于 `dealDamage` `heal` `createStatus` `switchActive` 等操作，需要指定一个或多个角色。由于数据描述语境缺乏大量信息（比如角色 ID、角色位置等），所以需要一个更适合数据描述的语法。下述语法定义在 `Target` 对象内：

| 语法              | 含义                                                         |
| ----------------- | ------------------------------------------------------------ |
| `UNDEFINED`       | 不指明，使用默认值                                           |
| `ME`              | 己方阵营修饰（不单独使用）                                   |
| `OPP`             | 对方阵营修饰（不单独使用）                                   |
| `ACTIVE`          | 出战角色，应附加阵营修饰                                     |
| `NEXT`            | 下一（右侧）角色，应附加阵营修饰                             |
| `OPP`             | 上一（左侧）角色，应附加阵营修饰                             |
| `STANDBY`         | 后台角色，应附加阵营修饰                                     |
| `ALL`             | 所有角色，应附加阵营修饰                                     |
| `WITH_STATUS(id)` | 带有 `id` 状态的角色，应附加阵营修饰                         |
| `OF_OBJ_ID(id)`   | 己方角色 ID 为 `id` 的角色                                   |
| `NEARBY`          | “最近的对方角色”修饰（不单独使用，被修饰的角色应当只有一个） |

`NEARBY` 给温迪用的。

目标默认值：

- 对于 `dealDamage`，是对方出战角色 `ACTIVE | OPP`。
- 对于 `heal`、`gainEnergy`，是己方出战角色 `ACTIVE | ME`。
- 对于 `create[Combat]Status`，是己方出战角色 `ACTIVE | ME`。
- 对于 `switchActive`，是己方下一出战角色 `NEXT | ME`。
