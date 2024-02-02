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
  characterStatus(id: StatusHandle, target = "@caller"): void;
  combatStatus(id: StatusHandle, where: "my" | "opp" = "my"): void;
  createSupport(id: SupportHandle, where: "my" | "opp"): void;
  dispose(target = "@caller"): void;
  setVariable(prop: string, value: number, target = "@caller"): void;
  addVariable(prop: string, value: number, target = "@caller"): void;
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

### 不修改对局状态的方法

```ts
interface SkillContext {
  state: GameState;
  player: PlayerState;
  oppPlayer: PlayerState;
  isMyTurn(): boolean;
  $(arg): AnyContext | null;
  $$(arg): AnyContext[];
  of(st: EntityState | CharacterState): EntityContext | CharacterContext;
  caller(): Context-of-CallerType;
  countOfThisSkill(): number;

  random<T>(...items: T[]): T;
}
```

### 其它修改对局状态的方法

```ts
interface SkillContext {
  absorbDice(strategy: "seq" | "diff", count: number): DiceType[];
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
  fullEnergy(): boolean;
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

