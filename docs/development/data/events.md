# 事件列表

## 核心事件列表

对局过程中所有可能引发技能的时间点和附带参数称为**核心事件**。核心事件有常规事件、有副作用事件和特殊事件。

### 常规事件列表

| 事件名                         | 含义             |
| ------------------------------ | ---------------- |
| `onBattleBegin`                | 战斗开始时       |
| `onActionPhase`                | 行动阶段开始时   |
| `onEndPhase`                   | 结束阶段时       |
| `onBeforeAction`               | 玩家行动前       |
| `onAction`                     | 玩家行动后       |
| `onSwitchActive`               | 切换出战角色时   |
| `onDamage`                     | 造成/受到伤害时  |
| `onHeal`                       | 造成/受到治疗时  |
| `onReaction`                   | 发生元素反应时   |
| `onEnter`                      | 实体入场时       |
| `onDispose`                    | 实体弃置时       |
| `onDefeated`                   | 角色击倒时       |
| `onRevive`                     | 角色复苏时       |
| `onReplaceCharacterDefinition` | 角色定义被转换时 |

### 有副作用事件列表

| 事件名             | 含义                                       |
| ------------------ | ------------------------------------------ |
| `modifyRoll`       | 掷骰阶段时（修改掷骰属性）                 |
| `modifyAction`     | 修改玩家行动属性（骰子要求或快速行动与否） |
| `modifyDamage0`    | 修改伤害（第一次，可修改伤害类型）         |
| `modifyDamage1`    | 修改伤害（第二次，只可修改伤害数值）       |
| `modifyZeroHealth` | 角色击倒前（免于被击倒）                   |

有副作用事件会在所有实体的响应过程中记录一些信息（如修改的伤害值），供调用方（技能或者游戏流程）使用。

#### 内联技能

监听 `modifyDamage0` 和 `modifyDamage1` 的技能是**内联技能**，它们是在另一个技能（造成伤害）的计算过程中引发。内联技能在执行过程中所引发的所有事件，都算在“上级”技能的引发事件列表中。内联技能执行完毕后没有暂停点；程序也**不会**暂停“上级技能”的执行转而先去处理内联技能引发的那些事件。

### 特殊事件

| 事件名          | 含义                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `replaceAction` | 该事件不会被“引发”，而是在玩家行动前检查，若有则执行技能并跳过玩家行动 |

## 细分事件列表

为方便编写卡牌数据，不直接根据核心事件编写技能，而是根据筛选和细分后的细分事件名来编写；传入 `.on` builder chain 方法的是响应细分事件名。响应细分事件=响应核心事件+满足条件。

| 事件名                       | 对应核心事件                   | 条件                                      |
| ---------------------------- | ------------------------------ | ----------------------------------------- |
| `roll`                       | `modifyRoll`                   | **我方**掷骰时                            |
| `modifyAction`               | `modifyAction`                 | **我方**用骰/设置快速行动时               |
| `deductDiceSwitch`           | `modifyAction`                 | 我方尝试减少切换角色行动的骰子时          |
| `deductDiceCard`             | `modifyAction`                 | 我方尝试减少打出手牌的骰子时              |
| `deductDiceSkill`            | `modifyAction`                 | 我方/所附着角色尝试减少角色技能的骰子时   |
| `beforeFastSwitch`           | `modifyAction`                 | 我方尝试设置切换角色行动为快速行动时      |
| `modifyDamageType`           | `modifyDamage0`                | 我方/所附着角色造成伤害（第一次修改）     |
| `modifySkillDamageType`      | `modifyDamage0`                | 我方/所附着角色技能造成伤害（第一次修改） |
| `modifyDamage`               | `modifyDamage1`                | 我方/所附着角色造成伤害（第二次修改）     |
| `modifySkillDamage`          | `modifyDamage1`                | 我方/所附着角色技能造成伤害（第二次修改） |
| `beforeDamaged`              | `modifyDamage1`                | 我方/所附着角色受到伤害（第二次修改）     |
| `beforeDefeated`             | `modifyZeroHealth`             | 我方/所附着角色免于被击倒                 |
| `battleBegin`                | `onBattleBegin`                | 等价                                      |
| `actionPhase`                | `onActionPhase`                | 等价                                      |
| `endPhase`                   | `onEndPhase`                   | 等价                                      |
| `beforeAction`               | `onBeforeAction`               | **我方**玩家行动前                        |
| `replaceAction`              | `replaceAction`                | 等价                      |
| `action`                     | `onAction`                     | **我方**玩家行动后                        |
| `playCard`                   | `onAction`                     | 我方玩家打出手牌后                        |
| `declareEnd`                 | `onAction`                     | 我方玩家宣布回合结束后                    |
| `useSkill`                   | `onAction`                     | **我方**玩家使用**主动角色**技能后        |
| `switchActive`               | `onSwitchActive`               | 我方/所附着角色被切出/切入后              |
| `dealDamage`                 | `onDamage`                     | 我方/所附着角色造成伤害后                 |
| `damaged`                    | `onDamage`                     | 我方/所附着角色受到伤害后                 |
| `healed`                     | `onHeal`                       | 我方/所附着角色受到治疗后                 |
| `reaction`                   | `onReaction`                   | 我方/所附着**角色上发生**元素伤害后       |
| `enter`                      | `onEnter`                      | 实体**自身**入场时                        |
| `dispose`                    | `onDispose`                    | 我方实体弃置时                            |
| `selfDispose`                | `onDispose`                    | 实体**自身**弃置时                        |
| `defeated`                   | `onDefeated`                   | 我方/所附着角色倒下时                     |
| `revive`                     | `onRevive`                     | **我方**角色复苏时                        |
| `replaceCharacterDefinition` | `onReplaceCharacterDefinition` | 我方/所附着角色定义被转换时               |

上表所述“我方”，是指实体技能发起者的阵营，“我方所附着角色”是指若实体区域是角色的所在角色。该描述仅适用于默认的 [`.listenToXxx` 选项](./entity.md#监听范围)，对于 `.listenToPlayer`，会响应所有“我方”事件，对于 `.listenToAll`，会响应场上所有来源的事件。
