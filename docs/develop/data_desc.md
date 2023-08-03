# 数据描述方法

## 综述

`@gi-tcg/data` 库用于描述卡牌。描述格式类似 builder pattern，例如下面是芭芭拉元素战技的描述：

```ts
/**
 * **演唱，开始♪**
 * 造成1点水元素伤害，召唤歌声之环。
 */
const LetTheShowBegin = createSkill(12012) // 技能 ID 为 12012
  .setType("elemental")                    // 元素战技
  .costHydro(3)                            // 消耗 3 个水骰子
  .dealDamage(1, DamageType.Hydro)         // 造成 1 点水元素伤害
  .summon(MelodyLoop)                      // 召唤歌声之环
  .build();                                // 最后用 .build() 结束描述
```

上述 builder 链会返回一个 `Handle`，如 `createSkill` 即返回一个 `SkillHandle`，可在需要引用技能的地方使用。如芭芭拉的角色描述：

```ts
const Barbara = createCharacter(1201)          // 角色 ID 为 1201                  
  .addTags("hydro", "catalyst", "mondstadt")   // 角色标签
  .addSkills(LetTheShowBegin, /* 其它技能 */)  // 角色技能列表
  .build();                                    // 最后用 .build() 结束描述
```

## 主动描述

卡牌、技能由用户手动触发，在 `createSkill` 和 `createCharacter` 的 builder 链中，可以直接向上一节中描述其行为。简单的卡牌描述如下：

```ts
/**
 * **元素共鸣：愈疗之水**
 * 治疗我方出战角色2点。然后，治疗所有我方后台角色1点。
 * （牌组包含至少2个水元素角色，才能加入牌组）
 */
const ElementalResonanceSoothingWater = createCard(331202) // 卡牌 ID 为 331202
  .setType("event")                   // 卡牌类别：事件牌
  .addTags("resonance")               // 卡牌标签：元素共鸣
  .requireDualCharacterTag("hydro")   // 组牌要求：2 个水元素角色
  .costHydro(1)                       // 消耗 1 个水骰子
  .heal(2, "|")                       // 治疗出战角色 2 点（ "|" 含义参见角色选择器）
  .heal(1, "<>")                      // 治疗后台角色 1 点（同上）
  .build();                           // 最后用 .build() 结束描述
```

对于复杂的描述，可使用 `do` 方法，在 `do` 内部通过 `c` 参数来描述行为。`do` 内部可以使用分支、循环等操作。如：

```ts
/**
 * **星斗归位**
 * 造成3点雷元素伤害，生成手牌雷楔。
 */
const StellarRestoration = createSkill(14032)
  .setType("elemental")
  .costElectro(3)
  .dealDamage(3, DamageType.Electro)
  .do((c) => {
    // 若此技能由「雷楔」触发……
    if (c.triggeredByCard(LightningStiletto)) {
      // 则生成角色状态「雷元素附魔」；
      c.character.createStatus(ElectroInfusion);
    } else {
      // 否则，生成手牌「雷楔」。
      c.createCards(LightningStiletto);
    }
  })
  .build();
```

### 卡牌使用目标

食物牌、装备牌、「诸武精通」等、「快快缝补术」等卡牌，需要指定目标。在 `createCard` 中，提供第二参数以指明是何种目标：

```ts
createCard(id)                             // 此卡牌无需指定目标
createCard(id, ["character"])              // 此卡牌需要指定一个角色
createCard(id, ["summon"])                 // 此卡牌需要指定一个召唤物
createCard(id, ["character", "character"]) // 此卡牌需要指定两个角色
```

随后，在描述语境 `c` 中的 `target` 属性，即为上述目标的对应语境。

默认情况下，双方场上的所有目标都会被视为可用的目标。因此需要通过以下方式添加目标筛选器：

```ts
/**
 * **神宝迁宫祝词**
 * 将一个装备在我方角色的「圣遗物」装备牌，转移给另一个我方角色。
 */
const BlessingOfTheDivineRelicsInstallation = createCard(332011, ["character", "character"])
  .setType("event")
  // 只选我方场上的角色；
  // 此外，第一个角色持有圣遗物，第二个角色不等于第一个角色
  .filterMyTargets((ch0, ch1) => !!ch0.findEquipment("artifact") && ch0.entityId !== ch1.entityId)
  .do(...)
```

`filterMyTargets` 和 `filterOppTargets` builder 方法可用于筛选目标，并提供辅助的筛选条件。如果无额外筛选条件，可填入 `() => true`：

```ts
/**
 * **快快缝补术**
 * 选择一个我方「召唤物」，使其「可用次数」+1。
 */
const QuickKnit = createCard(332012, ["summon"])
  .setType("event")
  .costSame(1)
  .filterMyTargets(() => true)
  .do((c) => {
    const summon = c.target[0];
    summon.setUsage(summon.usage + 1);
  })
  .build();
```

#### 天赋牌筛选器

天赋牌通常作为装备牌，要求只能装备到某一角色上。大部分的天赋牌，还要求该角色必须是出战角色。为此，提供了简便的 builder 方法 `addCharacterFilter`：

```ts
/**
 * **蒲公英的国土**
 * 战斗行动：我方出战角色为琴时，装备此牌。
 * 琴装备此牌后，立刻使用一次蒲公英之风。
 * 装备有此牌的琴在场时，蒲公英领域会使我方造成的风元素伤害+1。
 * （牌组中包含琴，才能加入牌组）
 */
export const LandsOfDandelion = createCard(215021, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Jean)    // 牌组中包含琴，才能加入牌组
  .addCharacterFilter(Jean)  // 目标必须是琴，而且琴必须出战
  .costAnemo(4)
  .costEnergy(3)
  .buildToEquipment()        // 场地牌描述语法，见后文
  .on("enter", (c) => { c.useSkill(DandelionBreeze) })
  .build();
```

如神里绫华「寒天宣命祝词」等目标角色不需要出战的，可额外添加 `{ needActive: false }` 选项：

```ts
/**
 * **寒天宣命祝词**
 * 装备有此牌的神里绫华生成的冰元素附魔会使所附属角色造成的冰元素伤害+1。
 * 切换到装备有此牌的神里绫华时：少花费1个元素骰。（每回合1次）
 * （牌组中包含神里绫华，才能加入牌组）
 */
export const KantenSenmyouBlessing = createCard(211051, ["character"])
  .setType("equipment")
  .addTags("talent")
  .requireCharacter(KamisatoAyaka)
  .addCharacterFilter(KamisatoAyaka, { needActive: false })
  .costCryo(2)
  .buildToEquipment()
  // [...]
```

### 卡牌可使用性筛选器

如「本大爷还不能输」、秘传牌等，需要满足一定条件才可使用，则通过 builder 方法 `addFilter` 查询全局状态以判断是否可以使用。

```cpp
/**
 * **磐岩盟契**
 * 我方剩余元素骰数量为0时，才能打出：
 * 生成2个不同的基础元素骰。
 * （整局游戏只能打出一张「秘传」卡牌：这张牌一定在你的起始手牌中）
 */
const CovenantOfRock = createCard(330002)
  .setType("event")
  .addTags("legend")
  // 尚未使用秘传牌
  .addFilter((c) => !c.checkSpecialBit(SpecialBits.LegendUsed))
  // 且剩余元素骰数量为 0
  .addFilter((c) => c.dice.length === 0)
  .do((c) => { c.generateRandomElementDice(2); })
  .build();
```

## 被动描述

被动技能、装备牌、角色状态、出战状态、召唤物和支援牌总是在某一时刻引发相关的操作。这些时刻可在[事件列表](./events.md#事件列表)中找到。

对于某一事件 <code>on<em>Event</em></code> 下引发的操作，在 `create...` 的 builder 链的 `on` 方法中描述，并以 <code>"<em>event</em>"</code> 作为其首个参数。例如凯亚元素爆发生成的「寒冰之棱」：

```ts
const Icicle = createStatus(111031)    // 状态 ID 为 111031
  .withUsage(3)                        // 可用次数：3
  .on("switchActive", (c) => {         // 当切换角色时（响应 onSwitchActive 事件）
    c.dealDamage(2, DamageType.Cryo);  // 造成 2 点冰元素伤害
  })
  .build();                            // 最后用 .build() 结束描述
```

### 通用附加属性

以下 builder 链方法对所有被动描述都适用：

#### `withUsage` 可用次数

每次调用 `on` 方法后，都会自动扣除一次可用次数；当可用次数耗尽时，该实体被弃置。如果不想扣除可用次数，应当在该方法的回调函数中指明 `return false`，或者增加条件参数如：

```ts
/**
 * **游医的方巾**
 * 角色使用「元素爆发」后：治疗所有我方角色1点。（每回合1次）
 * （角色最多装备1件「圣遗物」）
 */
const TravelingDoctorsHandkerchief = 
  // ...
  .withUsagePerRound(1)
  .on("useSkill", 
    (c) => c.info.type === "burst",  // 可选的第二参数，返回一个布尔值用于指明是否扣除可用次数
    (c) => c.queryCharacterAll("*").forEach(c => c.heal(1)))
  .build();
```

#### `withUsagePerRound` 每回合可用次数

同上，但是该数值耗尽后不会弃置实体；下一回合的行动阶段开始时会恢复到初始数值。

#### `withDuration` 持续回合数

每回合行动阶段开始时自动扣除 1，若耗尽则该实体被弃置。例如：

```ts
/**
 * **千年的大乐章·别离之歌**
 * 我方角色造成的伤害+1。
 * 持续回合：2
 */
const MillennialMovementFarewellSong = createStatus(301102)
  .withDuration(2)
  .on("beforeDealDamage", (c) => { c.addDamage(2); })
  .build();
```

### 自定义附加属性

使用 `withThis` 方法来自定义该实体的属性。常用于角色固有状态（如「雷厄法曜之眼」等）、带计数支援牌（如「瓦格纳」等）。

```ts
/**
 * **寻宝仙灵**
 * 我方角色使用技能后：此牌累积1个「寻宝线索」。
 * 当此牌已累积3个「寻宝线索」时，弃置此牌：抓3张牌。
 */
const TreasureseekingSeelie = createCard(323004)
  .setType("support")
  .addTags("item")
  .costSame(1)
  .buildToSupport()
  .withThis({ clue: 0 })       // 自定义属性 clue，入场时初始值为 0
  .on("useSkill", (c) => {
    c.this.clue++;             // 使用 c.this 来访问自定义属性
    if (c.this.clue === 3) {
      c.drawCards(3);
      c.this.dispose();
    }
  })
  .build();
```

对于有多个 `on` 处理函数独立计算可用次数的场景，可通过 `withThis` 定义计数变量。对于每回合可用数，需要在 `onActionPhase` 中清空。

> **Warning**
> `withThis` 期望接受一个对象（`Object`），其属性只能是初等值、`Array`、平凡 `Object`、`Set` 或者 `Map`。不可引入类实例、函数等。此限制是因为核心库使用 `Immer` 维护这些属性的不可变状态。

### 常见词条的处理方式

#### 食物牌

食物牌（复活料理除外）即使用后自动对目标调用 `createStatus(Satiated)` 的卡牌。`data/cards/event/foods.ts` 中编写了 `createFood` 函数以简化此流程。

#### 场地牌与装备牌

场地牌即使用后自动调用 `createSupport` 的卡牌。`createCard` 的 builder 链中提供了 `buildToSupport` 方法，即可将后续的 builder 链转换为场地牌的描述方法。

类似地，`buildToEquipment` 自动调用目标角色的 `equip`，并返回新的 builder —— 将后续的 builder 链转换为装备牌的描述方法。

## 全局操作语境 `c`

所有的事件响应器都继承自全局操作语境 `Context`，包括如下接口：

- `dealDamage` 造成伤害
- `applyElement` 附着元素
- `createCombatStatus` 生成出战状态
- `summon` 召唤召唤物
- `createSupport` 生成支援
- `generateDice` 生成骰子
- `generateRandomElementDice` 生成随机基础元素骰子
- `absorbDice` 回收骰子
- `rollDice` 重新掷骰
- `drawCards` 从牌堆抽取手牌
- `createCards` 生成手牌（刻晴战技）
- `switchCards` 重抽手牌（草与智慧）
- `switchActive` 切换出战角色
- `useSkill` 使用出战角色的技能
- `actionAgain` 强制修改行动轮轮转（风与自由）

### 只读数据接口

以下接口的访问不会修改游戏状态。可选第 2 参数（条件筛选）中的 `c` 只能使用以下接口。

- `currentPhase` 当前阶段
- `currentTurn` 当前回合数
- `isMyTurn()` 是否是我方回合
- `fullSupportArea(opp = false)` 支援区是否满
- `findSummon(summonHandle)` 查找召唤物
- `allSummon(includeOpp = false)` 所有召唤物（护法之誓、潮涌与激流）
- `findCombatStatus` 查找出战状态
- `findCombatShield` 查找具有护盾的出战状态（坚定之岩、贯虹之槊）

## 角色选择器语法

修改角色数据的操作在 `CharacterContext` 里定义。使用 `queryCharacter` 或 `queryCharacterAll` 和角色选择器语法来指定角色。对于 `dealDamage` `heal` `createStatus` `switchActive` 等操作，也需要用该语法来指定一个或多个角色。

- [角色选择器语法参考](./selector.md)
- [角色操作语境](./context_details.md#角色操作语境)
