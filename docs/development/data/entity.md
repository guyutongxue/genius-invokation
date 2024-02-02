# 定义状态、出战状态和召唤物

## 触发时机

所有实体（以及被动技能）的操作会在某一时机触发。在这些实体的 builder chain 中，使用 `.on` 方法来描述接下来的操作是由何事件触发的，如：

```ts
/** 西风大教堂 */
const FavoniusCathedral = card(321006)
  // [...]
  .on("endPhase")         // 结束阶段时：
  .usage(2)               // 可用次数 2
  .heal(2, "my active")   // 治疗我方出战角色 2 点
  .done();
```

## 触发条件

卡牌描述中，所有冒号之前的部分都是触发的条件：**它们基于事件发生时刻的对局情况进行条件计算，而非后续操作引发的时间点计算**。因此不能简单地在后续的操作中使用 `if` 来实现触发条件，你需要将它们作为 `on` 的参数传入。例：

```ts
/** 摩耶之殿：我方造成元素反应时，伤害 +1 */
const ShrineOfMaya = combatStatus(117032)
  // [...]
  .on("beforeDealDamage", (c) => getReaction(c.damageInfo) !== null)
  .increaseDamage(1)
  // [...]
```

所有的触发事件都提供了额外的信息，比如“使用技能后”时间的额外信息为 `c.eventArg`，是一个 `SkillInfo` 对象。所有的异步事件的额外信息都在 `c.eventArg` 内；同步事件则注入在 `c` 参数内，具体参考文档见 ???。此外，我还提供了一些常见的条件检测函数，也从 `@gi-tcg/core/builder` 导出。

`c.eventArg` 可直接从条件判断函数的第二个参数访问，如 `(c, e) => checkFoo(e)`。

## 可用次数

通过 `.usage` 方法设置响应操作的可用次数。只有当触发条件满足时，可用次数才会扣除；当某次触发事件执行完毕，扣除可用次数到 0 之后，实体会自动弃置。

```ts
/** 温迪：风域 */
const Stormzone = combatStatus(115031)
  .on("beforeUseDice", (c) => canSwitchDeductCost1(c))
  .usage(2)
  .deductCost(DiceType.Omni, 1)
  .done();
```

如果不希望可用次数到 0 时自动弃置（但仍然保留“可用次数”这一变量名），则在 `.usage` 的第二参数给出 `{ autoDispose: false }`：

```ts
/** 莫娜：虚影 */
const Reflection = summon(112031)
  // [...]
  .on("beforeDamaged", (c) => c.of(c.damageInfo.target).isActive())
  .usage(1, { autoDispose: false })
  .decreaseDamage(1)
  .done();
```

“每回合可用次数”使用 `.usagePerRound`：

```ts
/** 破冰踏雪的回音 */
const BrokenRimesEcho = card(312101)
  .costVoid(2)
  .artifact()
  .on("beforeUseDiceCharacterSkillOrTalent", /** [...] */)
  .usagePerRound(1)
  .deductCost(DiceType.Cryo, 1)
  .done();
```

## 变量

使用 `.variable` 为该实体添加一个变量定义，传入初始值；可选地传入最大值。在同一位置重新创建时，若最大值大于初始值，则会累加。

```ts
/** 提米 */
const Timmie = card(322007)
  .support("ally")
  .variable("pigeon", 1)
  .on("actionPhase")
  .do((c) => /** [...] */)
  .done();
```

> `.usage` 默认创建名为 `usage` 的变量；`.shield` 默认创建名为 `shield` 的变量。

