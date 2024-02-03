# 操作描述

## 综述

有两种方式描述操作：
1. **声明域描述**，直接在 builder chain 中指定操作方法
2. **脚本域描述**，在 `.do` 方法内执行任意 JavaScript 语句

以下是两种描述方式的例子：

```ts
/** 优菈：冷酷之心 */

// 声明域描述方式：
const Grimheart = status(111061)
  .on("beforeDealDamage", /** [...] */)
  .increaseDamage(3)
  .dispose()
  .done();

// 脚本域描述方式：
const Grimheart = status(111061)
  .on("beforeDealDamage", (c) => /** [...] */)
  .do((c) => {
    c.increaseDamage(3);
    c.dispose();
  })
  .done();
```

对于简单的操作描述，可以直接在 builder chain 中指明，这就是声明域的工作方式。对于复杂的操作，比如需要读取已有的对局状态数据、分支循环等控制流等，就需要通过 `.do` 引入脚本域，然后在其中进行操作。

传入 `.do` 的参数是一个函数，函数的参数 `c` 是 `SkillContext` 类型的对象，调用 `c` 上的一些方法就可以完成对游戏状态的读取和更改。当技能被使用时，核心库会生成好 `c` 实参，然后传入 `do` 的函数参数，从而执行这个实体所定义的操作。在声明域的调用会自动转换为 `.do` 和对其中 `c` 的调用。

## `SkillContext`

### `self`

每个技能都有技能的发起者（Caller）：对于实体的相应操作，实体就是发起者；对于角色技能（主动或被动），角色就是发起者；对于使用卡牌的操作，使用卡牌玩家的当前出战角色是发起者。在技能描述中，使用 `c.self` 或者 `@self` 查询访问发起者。比如若角色技能描述称“为自身增加一点充能”，则描述为 `.gainEnergy(1, "@self")`。若实体想要访问自身的变量，使用 `c.self.getVariable`。

`c.self` 会返回用于操作 `CharacterState` 或 `EntityState` 的便捷类。它不仅给出了一些常用的查询状态的函数，还提供一些修改对局状态的方法（但都来自于 `SkillContext`），称为 `CharacterContext` 或 `EntityContext`。比如刚才的 `getVariable` 函数会访问 `.state.variables`，而类似的 `setVariable` 则会调用 `SkillContext` 的 `setVariable(...)`，即作为技能定义操作的一部分。

### 常用操作列表

以下操作定义于 `SkillContext` 中，它们也同时暴露到声明域中供直接调用：

```ts
interface SkillContext {
  switchActive(target): void;
  gainEnergy(value: number, target): void;
  heal(value: number, target): void;
  damage(type: DamageType, value: number, target = "opp active"): void;
  apply(type: DamageType, target): void;
  summon(id: SummonHandle, where: "my" | "opp" = "my"): void;
  characterStatus(id: StatusHandle, target = "@self"): void;
  combatStatus(id: StatusHandle, where: "my" | "opp" = "my"): void;
  createSupport(id: SupportHandle, where: "my" | "opp"): void;
  dispose(target = "@self"): void;
  setVariable(prop: string, value: number, target = "@self"): void;
  addVariable(prop: string, value: number, target = "@self"): void;
  replaceDefinition(target, newCh: CharacterHandle): void;
  generateDice(type: DiceType | "randomElement", count: number): void;
  createHandCard(card: CardHandle): void;
  drawCards(count: number, opt: DrawCardsOpt): void;
  switchCards(): void;
  reroll(times: number): void;
  useSkill(skill: SkillHandle | "normal"): void;
}

interface DrawCardsOpt {
  who?: "my" | "opp";
  withTag?: CardTag | null;
}
```

所有返回 `void` 的函数都被自动添加到声明域以方便编写。

### 其它修改对局状态的方法

```ts
interface SkillContext {
  absorbDice(strategy: "seq" | "diff", count: number): DiceType[];
}
```

由于 `absorbDice` 返回值有意义（为被回收的骰子值），因此不能在声明域使用。

### 不修改对局状态的方法

```ts
interface SkillContext {
  state: GameState;
  player: PlayerState;
  oppPlayer: PlayerState;

  self: Context-of-CallerType;
  $(arg): AnyContext | null;
  $$(arg): AnyContext[];
  of(st: EntityState | CharacterState): EntityContext | CharacterContext;

  isMyTurn(): boolean;
  countOfThisSkill(): number;

  random<T>(...items: T[]): T;
}
```


## `CharacterContext`

在一个给定的技能描述语境下，对 `CharacterState` 提供一些便利方法。

### 不修改对局状态的方法

```ts
interface CharacterContext {
  area: EntityArea;
  who: 0 | 1;
  id: number;
  state: CharacterState
  health: number;
  aura: Aura;
  positionIndex(): number;
  satisftyPosition(pos: CharacterPosition): boolean;
  isActive(): boolean;
  isMine(): boolean;
  fullEnergy(): boolean;
  element(): DiceType;
  hasArtifact(): EntityState | null;
  hasWeapon(): EntityState | null;
  hasStatus(id: StatusHandle): EntityState | null;
  $$(arg): EntityContext[];

  getVariable(prop: string): number;
}
```

### 修改对局状态的方法

```ts
interface CharacterContext {
  gainEnergy(value: number = 1): void;
  heal(value: number): void;
  damage(type: DamageType, value: number): void;
  apply(type: DamageType): void;
  addStatus(status: StatusHandle): void;
  equip(equipment: EquipmentHandle): void;
  removeArtifact(): EntityState | null;
  removeWeapon(): EntityState | null;
  loseEnergy(value: number = 1): void;

  setVariable(prop: string, value: number): void;
  addVariable(prop: string, value: number): void;
}
```

## `EntityContext`

在一个给定的技能描述语境下，对 `EntityState` 提供一些便利方法。

### 不修改对局状态的方法

```ts
interface EntityContext {
  area: EntityArea;
  who: 0 | 1;
  id: number;
  state: EntityState
  health: number;
  master(): CharacterContext;

  getVariable(prop: string): number;
}
```

### 修改对局状态的方法

```ts
interface EntityContext {
  setVariable(prop: string, value: number): void;
  addVariable(prop: string, value: number): void;
  dispose(): void;
}
```

## 声明域的流程控制

声明域提供了 `.if` 和 `.else` 用来处理简单的流程控制。`.if` 接受一个条件；仅当条件满足时才会执行**下一条**声明域 builder 方法。`.else` 则是仅当上一次出现的 `.if` 不成立时，执行**下一条**声明域 builder 方法。

```ts
/** 班尼特：美妙旅程 */
const FantasticVoyage = skill(13033)
  .type("burst")
  // [...]
  .if((c) => c.self.hasEquipment(GrandExpectation))
  .combatStatus(InspirationField01)
  .else()
  .combatStatus(InspirationField)
  .done();
```

无法用 `.if` `.else` 控制多条 builder 方法（可以使用 `.do` “括起”；但是这样不如直接在脚本域中使用 `if` 语句）。
