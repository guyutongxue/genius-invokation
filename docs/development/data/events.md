# 事件列表

## 核心事件列表

### 同步事件

同步事件是指可在技能内部直接执行的事件，如修改伤害、掷骰、用骰数据的技能。它们绝不引发任何异步操作或者级联事件。

| 事件名             | 含义                                 |
| ------------------ | ------------------------------------ |
| `onRoll`           | 修改掷骰选项                         |
| `onBeforeUseDice`  | 行动前修改骰子需求或者改为快速行动   |
| `onBeforeDamage0`  | 修改伤害（第一次，可修改伤害类型）   |
| `onBeforeDamage1`  | 修改伤害（第二次，只可修改伤害数值） |
| `onBeforeDefeated` | 设置免于被击倒                       |

### 异步事件

异步事件指：

- 这些事件的引发时间点（即对应时刻的对局状态）和技能执行时（作用的对局状态）不一定匹配；
- 这些事件上执行的技能可能进一步引发异步操作或者新的事件。

| 事件名                | 含义            |
| --------------------- | --------------- |
| `onBattleBegin`       | 战斗开始时      |
| `onActionPhase`       | 行动阶段开始时  |
| `onEndPhase`          | 结束阶段时      |
| `onBeforeAction`      | 玩家行动前      |
| `onAction`            | 玩家行动后      |
| `onSkill`             | 技能执行后      |
| `onSwitchActive`      | 切换出战角色时  |
| `onDamage`            | 造成/受到伤害时 |
| `onHeal`              | 造成/受到治疗时 |
| `onElementalReaction` | 发生元素反应时  |
| `onEnter`             | 实体入场时      |
| `onDisposing`         | 实体弃置时      |
| `onDefeated`          | 角色击倒时      |
| `onRevive`            | 角色复苏时      |

### 特殊事件

| 事件名            | 含义                                                                   |
| ----------------- | ---------------------------------------------------------------------- |
| `onReplaceAction` | 该事件不会被“引发”，而是在玩家行动前检查，若有则执行技能并跳过玩家行动 |

## 细分事件列表

为方便编写卡牌数据，不直接根据核心事件编写技能，而是根据筛选和细分后的细分事件名来编写；传入 `.on` builder chain 方法的是响应细分事件名。响应细分事件=响应核心事件+满足条件。

| 事件名                                | 对应核心事件          | 条件                                      |
| ------------------------------------- | --------------------- | ----------------------------------------- |
| `roll`                                | `onRoll`              | **我方**掷骰时                            |
| `beforeUseDice`                       | `onBeforeUseDice`     | **我方**用骰/设置快速行动时               |
| `beforeUseDiceCharacterSkillOrTalent` | `onBeforeUseDice`     | 我方使用角色技能或打出天赋牌时            |
| `beforeSwitchFast`                    | `onBeforeUseDice`     | 我方切换角色且切换角色行动不是快速行动时  |
| `beforeDamageType`                    | `onBeforeDamage0`     | 我方/所附着角色造成伤害（第一次修改）     |
| `beforeSkillDamageType`               | `onBeforeDamage0`     | 我方/所附着角色技能造成伤害（第一次修改） |
| `beforeDealDamage`                    | `onBeforeDamage1`     | 我方/所附着角色造成伤害（第二次修改）     |
| `beforeSkillDamage`                   | `onBeforeDamage1`     | 我方/所附着角色技能造成伤害（第二次修改） |
| `beforeDamaged`                       | `onBeforeDamage1`     | 我方/所附着角色受到伤害（第二次修改）     |
| `beforeDefeated`                      | `onBeforeDefeated`    | 我方/所附着角色免于被击倒                 |
| `battleBegin`                         | `onBattleBegin`       | 等价                                      |
| `actionPhase`                         | `onActionPhase`       | 等价                                      |
| `endPhase`                            | `onEndPhase`          | 等价                                      |
| `beforeAction`                        | `onBeforeAction`      | **我方**玩家行动前                        |
| `replaceAction`                       | `onReplaceAction`     | 替换**我方**玩家行动                      |
| `action`                              | `onAction`            | **我方**玩家行动后                        |
| `playCard`                            | `onAction`            | 我方玩家打出手牌后                        |
| `declareEnd`                          | `onDeclareEnd`        | 我方玩家宣布回合结束后                    |
| `skill`                               | `onSkill`             | **我方**玩家使用**主动角色**技能后        |
| `switchActive`                        | `onSwitchActive`      | 我方/所附着角色被切出/切入后              |
| `dealDamage`                          | `onDamage`            | 我方/所附着角色造成伤害后                 |
| `damaged`                             | `onDamage`            | 我方/所附着角色受到伤害后                 |
| `healed`                              | `onHeal`              | 我方/所附着角色受到治疗后                 |
| `elementalReaction`                   | `onElementalReaction` | 我方/所附着**角色上发生**元素伤害后       |
| `enter`                               | `onEnter`             | 实体**自身**入场时                        |
| `dispose`                             | `onDisposing`         | 我方实体弃置时                            |
| `selfDispose`                         | `onDisposing`         | 实体**自身**弃置时                        |
| `defeated`                            | `onDefeated`          | 我方/所附着角色倒下时                     |
| `revive`                              | `onRevive`            | **我方**角色复苏时                        |


上表所述“我方”，是指实体技能发起者的阵营，“我方所附着角色”是指若实体区域是角色的所在角色。该描述仅适用于默认的 [`.listenToXxx` 选项](./entity.md#监听范围)，对于 `.listenToPlayer`，会响应所有“我方”事件，对于 `.listenToAll`，会响应场上所有来源的事件。
