import { DamageType, DiceType } from "@gi-tcg/typings";
import { PassiveSkillContext, SkillContext, SkillType, UseSkillAction, registerSkill } from "./skills";
import { EventHandlers, ListenTarget, EventNames, EventHandler, TriggerCondition } from "./events";
import { CardTag, CardTargetDescriptor, CardType, ContextOfTarget, FuzzyContextOfTarget, PlayCardContext, PlayCardFilter, ShownOption, registerCard } from "./cards";
import { EquipmentContext, EquipmentType, registerEquipment } from "./equipments";
import { CharacterTag, registerCharacter } from "./characters";
import { PrepareConfig, SHIELD_VALUE, ShieldConfig, StatusContext, StatusTag, registerStatus } from "./statuses";
import { SupportContext, SupportType, registerSupport } from "./supports";
import { SummonContext, registerSummon } from "./summons";
import { AddPrefix, RemovePrefix, addPrefix, capitalize } from "./utils";
import { Context } from "./global";
import { ValidSelector } from "./target";

export type CharacterHandle = number & { readonly _never: unique symbol };
export type SkillHandle = number & { readonly _never: unique symbol };
export type CardHandle = number & { readonly _never: unique symbol };
export type StatusHandle = number & { readonly _never2: unique symbol };
export type SummonHandle = number & { readonly _never: unique symbol };
export type SupportHandle = CardHandle & { readonly _never2: unique symbol };
export type EquipmentHandle = CardHandle & { readonly _never2: unique symbol };

type CommonAction<ExtPt, Writable extends boolean> = (c: Context<object, ExtPt, Writable>) => void;

class CharacterBuilder {
  private readonly tags: CharacterTag[] = [];
  private _maxHealth = 10;
  private _maxEnergy = 3;
  private readonly skills: SkillHandle[] = [];
  constructor(private readonly id: number) { }

  addTags(...tags: CharacterTag[]) {
    this.tags.push(...tags);
    return this;
  }

  addSkills(...skills: SkillHandle[]) {
    this.skills.push(...skills);
    return this;
  }

  maxHealth(value: number) {
    this._maxHealth = value;
    return this;
  }
  maxEnergy(value: number) {
    this._maxEnergy = value;
    return this;
  }

  build(): CharacterHandle {
    registerCharacter(this.id, {
      tags: this.tags,
      maxHealth: this._maxHealth,
      maxEnergy: this._maxEnergy,
      skills: this.skills,
    });
    return this.id as CharacterHandle;
  }
}

class ActionBuilderBase<ExtPt> {
  protected costs: DiceType[] = [];
  protected pushAction(action: CommonAction<ExtPt, true>) {
    throw new Error("Method not implemented.");
  }
  protected addCost(type: DiceType, count: number) {
    this.costs.push(...Array(count).fill(type));
    return this;
  }
  costVoid(count: number) {
    return this.addCost(DiceType.Void, count);
  }
  costCryo(count: number) {
    return this.addCost(DiceType.Cryo, count);
  }
  costHydro(count: number) {
    return this.addCost(DiceType.Hydro, count);
  }
  costPyro(count: number) {
    return this.addCost(DiceType.Pyro, count);
  }
  costElectro(count: number) {
    return this.addCost(DiceType.Electro, count);
  }
  costAnemo(count: number) {
    return this.addCost(DiceType.Anemo, count);
  }
  costGeo(count: number) {
    return this.addCost(DiceType.Geo, count);
  }
  costDendro(count: number) {
    return this.addCost(DiceType.Dendro, count);
  }
  costSame(count: number) {
    return this.addCost(DiceType.Same, count);
  }
  costEnergy(count: number) {
    return this.addCost(DiceType.Energy, count);
  }
  dealDamage<const Selector extends string>(value: number, type: DamageType, target?: ValidSelector<Selector>) {
    this.pushAction((c) => c.dealDamage(value, type, target));
    return this;
  }
  // applyElement
  heal<const Selector extends string>(value: number, target: ValidSelector<Selector>) {
    this.pushAction((c) => c.queryCharacter(target)?.heal(value));
    return this;
  }
  gainEnergyToActive(value: number) {
    this.pushAction((c) => c.queryCharacter("|")?.gainEnergy(value));
    return this;
  }
  createCombatStatus(status: StatusHandle, opp = false) {
    this.pushAction((c) => c.createCombatStatus(status, opp));
    return this;
  }
  summon(summon: SummonHandle) {
    this.pushAction((c) => c.summon(summon));
    return this;
  }
  rollDice(count: number) {
    this.pushAction((c) => c.rollDice(count));
    return this;
  }
  generateDice(...dice: DiceType[]) {
    this.pushAction((c) => c.generateDice(...dice));
    return this;
  }
  drawCards(count: number, opp?: boolean, tag?: CardTag) {
    this.pushAction((c) => c.drawCards(count, opp, tag));
    return this;
  }
  createCards(...cards: CardHandle[]) {
    this.pushAction((c) => c.createCards(...cards));
    return this;
  }
  switchCards() {
    this.pushAction((c) => c.switchCards());
    return this;
  }
  switchActive<const Selector extends string>(target: ValidSelector<Selector>) {
    this.pushAction((c) => c.switchActive(target));
    return this;
  }
  useSkill(skill: SkillHandle | "normal") {
    this.pushAction((c) => c.useSkill(skill));
    return this;
  }

}

class SkillBuilder extends ActionBuilderBase<SkillContext> {
  private type: Exclude<SkillType, "passive"> = "normal";
  private actions: UseSkillAction[] = [];
  private shouldGainEnergy = false;

  constructor(private readonly id: number) {
    super();
  }
  protected override pushAction(action: CommonAction<SkillContext, true>): void {
    this.actions.push(action);
  }

  setType(type: "normal" | "elemental", gainEnergy?: boolean): this;
  setType(type: "burst"): this;
  setType(type: "passive"): PassiveSkillBuilder;
  setType(type: SkillType, opt?: boolean): any {
    if (type === "passive") {
      return new PassiveSkillBuilder(this.id);
    } else if (type === "normal" || type === "elemental") {
      this.shouldGainEnergy = (opt ?? true) as boolean;
    }
    this.type = type;
    return this;
  }

  createCharacterStatus(status: StatusHandle) {
    this.actions.push((c) => { c.character.createStatus(status); });
    return this;
  }

  do(action: UseSkillAction) {
    this.actions.push(action);
    return this;
  }

  build(): SkillHandle {
    const action: UseSkillAction = async (c) => {
      for (const a of this.actions) {
        await a(c);
      }
    };
    registerSkill(this.id, {
      type: this.type,
      costs: this.costs,
      hidden: false, // TODO
      gainEnergy: this.shouldGainEnergy,
      action,
    });
    return this.id as SkillHandle;
  }
}

export interface CharacterTargetFilterOption {
  /**
   * 要求该角色必须为出战角色，默认为 `true`
   */
  needActive: boolean;
  /**
   * 要求该角色必须可使用技能（未被冻结、石化），默认为 `needActive`
   */
  needSkillEnabled: boolean;
}

class CardBuilder<
  const TargetT extends CardTargetDescriptor = []
> extends ActionBuilderBase<PlayCardContext> {
  private type: CardType = "event";
  private tags: CardTag[] = [];
  private shownOption: ShownOption = true;
  private filters: PlayCardFilter<TargetT>[] = [];
  private actions: CommonAction<PlayCardContext<TargetT>, true>[] = [];
  // 固定在最后做的操作，用于编写卡牌模板如食物牌
  private lastActions: CommonAction<PlayCardContext<TargetT>, true>[] = [];

  constructor(
    private readonly id: number,
    private readonly targetDescriptor?: TargetT
  ) {
    super();
  }

  protected override pushAction(action: CommonAction<PlayCardContext<TargetT>, true>) {
    this.actions.push(action);
  }

  setType(type: CardType) {
    this.type = type;
    return this;
  }

  hidden() {
    this.shownOption = false;
    return this;
  }
  requireDualCharacterTag(tag: CharacterTag) {
    this.shownOption = {
      requiredDualCharacterTag: tag,
    }
    return this;
  }
  requireCharacter(ch: CharacterHandle) {
    this.shownOption = {
      requiredCharacter: ch,
    }
    return this;
  }

  addTags(...tags: CardTag[]) {
    this.tags.push(...tags);
    return this;
  }
  addFilter(filter: PlayCardFilter<TargetT>) {
    this.filters.push(filter);
    return this;
  }
  addCharacterFilter(ch: CharacterHandle, opt: Partial<CharacterTargetFilterOption> = {}) {
    const self: unknown = this;
    CardBuilder.ensureTargetDescriptor(self);
    const needActive = opt.needActive ?? true;
    const needSkillEnabled = opt.needSkillEnabled ?? needActive;
    return self.filterMyTargets((c) => {
      if (c.info.id !== ch) return false;
      if (needActive && !c.isActive()) return false;
      if (needSkillEnabled && c.skillDisabled()) return false;
      return true;
    });
  }
  filterOppTargets(filter: (...targets: ContextOfTarget<TargetT>) => boolean) {
    this.filters.push((c: Context<object, PlayCardContext<TargetT>, false>) => {
      return (c.target as FuzzyContextOfTarget).every(t => !t.isMine()) && filter(...c.target)
    });
    return this;
  }
  filterMyTargets(filter: (...targets: ContextOfTarget<TargetT>) => boolean, includesDefeated = false) {
    this.filters.push((c: Context<object, PlayCardContext<TargetT>, false>) => {
      return (c.target as FuzzyContextOfTarget).every(t => t.isMine() &&
        (!("isAlive" in t) || includesDefeated || t.isAlive())) &&
        filter(...c.target)
    });
    return this;
  }
  do(action: CommonAction<PlayCardContext<TargetT>, true>) {
    this.pushAction(action);
    return this;
  }
  doAtLast(action: CommonAction<PlayCardContext<TargetT>, true>) {
    this.lastActions.push(action);
    return this;
  }

  build(): CardHandle {
    const outerThis = this;
    function finalFilter(this: ContextOfTarget<TargetT>, c: Context<never, any, false>) {
      for (const f of outerThis.filters) {
        if (!f.call(this, c)) {
          return false;
        }
      }
      return true;
    }
    async function* action(c: Context<never, any, true>) {
      for (const a of outerThis.actions) {
        await a(c);
        yield;
      }
      for (const a of outerThis.lastActions) {
        await a(c);
        yield;
      }
    }
    registerCard(this.id, {
      type: this.type,
      costs: this.costs,
      tags: this.tags,
      showWhen: this.shownOption,
      filter: finalFilter,
      action,
      target: this.targetDescriptor ?? [],
    });
    return this.id as CardHandle;
  }

  private static ensureTargetDescriptor(
    self: any
  ): asserts self is CardBuilder<["character"]> {
    if (
      !(
        self.targetDescriptor &&
        self.targetDescriptor.length === 1 &&
        self.targetDescriptor[0] === "character"
      )
    ) {
      throw new Error("Wrong target descriptor for further operation");
    }
  }

  buildToEquipment(): EquipmentBuilder {
    // Use a unknown version of this, then shrink to ["char"] target
    // Or TypeScript will keep this type as (this & ...)
    const cardBuilder: unknown = this;
    CardBuilder.ensureTargetDescriptor(cardBuilder);
    const eqBuilder = createEquipment(this.id);
    for (const weaponType of [
      "sword",
      "claymore",
      "pole",
      "catalyst",
      "bow",
    ] as const) {
      const cardTag = `weapon${capitalize(weaponType)}` as const;
      if (cardBuilder.tags.includes(cardTag)) {
        cardBuilder.filterMyTargets((c) => c.info.tags.includes(weaponType));
        eqBuilder.setType("weapon");
        break;
      }
    }
    if (cardBuilder.tags.includes("artifact")) {
      cardBuilder.filterMyTargets(() => true);
      eqBuilder.setType("artifact");
    }
    cardBuilder.actions.unshift((c) => {
      c.target[0].equip(cardBuilder.id as EquipmentHandle);
    });
    cardBuilder.setType("equipment").build();
    return eqBuilder;
  }

  buildToSupport(): SupportBuilder {
    const suppBuilder = createSupport(this.id);
    for (const tag of ["ally", "item", "place"] as const) {
      if (this.tags.includes(tag)) {
        suppBuilder.setType(tag);
        break;
      }
    }
    this.setType("support")
      .do((c) => c.createSupport(this.id as SupportHandle))
      .build();
    return suppBuilder;
  }

  buildToStatus(combatOrTarget: "active" | "combat" | "target0", id?: number): StatusBuilder<true> {
    const statusId = (id ?? this.id) as StatusHandle;
    const statusBuilder = createStatus<true>(statusId);
    if (combatOrTarget === "combat") {
      this.do((c) => c.createCombatStatus(statusId))
    } else if (combatOrTarget === "target0") {
      const s = this as any;
      CardBuilder.ensureTargetDescriptor(s);
      s.do((c) => c.target[0].createStatus(statusId));
    } else if (combatOrTarget === "active") {
      this.do((c) => c.queryCharacter("|")?.createStatus(statusId))
    }
    this.build();
    return statusBuilder;
  }
}

class TriggerBuilderBase<ThisT> {
  protected handlers: EventHandlers = {};
  protected state: any = null;
  protected duration = Infinity;
  protected usage = Infinity;
  protected maxUsage = Infinity;
  protected usagePerRound = Infinity;
  protected listenTo: ListenTarget = "master";

  withDuration(duration: number) {
    this.duration = duration;
    return this;
  }
  withUsage(usage: number, maxUsage?: number) {
    this.usage = usage;
    this.maxUsage = maxUsage ?? usage;
    return this;
  }
  withUsagePerRound(usage: number) {
    this.usagePerRound = usage;
    return this;
  }

  listenToOther() {
    this.listenTo = "my";
    return this;
  }
  listenToOpp() {
    this.listenTo = "all";
    return this;
  }

  on<E extends RemovePrefix<EventNames>>(
    event: E,
    handler: EventHandler<ThisT, AddPrefix<E>>
  ): this;
  on<E extends RemovePrefix<EventNames>>(
    event: E,
    cond: TriggerCondition<ThisT, AddPrefix<E>>,
    handler: EventHandler<ThisT, AddPrefix<E>>)
    : this;
  on(event: string, condOrHandler: any, handler?: any) {
    const handlerName = addPrefix(event) as EventNames;
    if (typeof handler === "function") {
      this.handlers[handlerName] = (c: any) => {
        if (condOrHandler(c)) {
          return handler(c);
        } else {
          return false;
        }
      }
    } else {
      this.handlers[handlerName] = condOrHandler;
    }
    return this;
  }
}

class PassiveSkillBuilder<ThisT = object> extends TriggerBuilderBase<ThisT & PassiveSkillContext<true>> {
  constructor(private readonly id: number) {
    super();
  }
  override withDuration(duration: number): never {
    throw new Error("Cannot set duration for passive skill");
  }
  override withUsage(usage: number): never {
    throw new Error("Cannot set usage for passive skill");
  }

  withThis<NewThisT extends object>(state: NewThisT): PassiveSkillBuilder<NewThisT & SkillContext<true>> {
    if (this.state !== null) {
      throw new Error("Cannot set this twice");
    }
    this.state = state;
    return this as unknown as PassiveSkillBuilder<NewThisT & SkillContext<true>>;
  }

  build(): SkillHandle {
    registerSkill(this.id, {
      type: "passive",
      listenTo: this.listenTo,
      usagePerRound: this.usagePerRound,
      handler: {
        handler: this.handlers,
        state: this.state ?? {}
      }
    });
    return this.id as SkillHandle;
  }
}

class StatusBuilder<BuildFromCard extends boolean = false, ThisT = {}> extends TriggerBuilderBase<ThisT & StatusContext<true>> {
  private tags: StatusTag[] = [];
  private prepareConfig: PrepareConfig = null;
  private shieldConfig: ShieldConfig = null;

  constructor(private readonly id: number) {
    super();
  }

  withThis<NewThisT extends object>(state: NewThisT): StatusBuilder<BuildFromCard, NewThisT & StatusContext<true>> {
    if (this.state !== null) {
      throw new Error("Cannot set this twice");
    }
    this.state = state;
    return this as unknown as StatusBuilder<BuildFromCard, NewThisT & StatusContext<true>>;
  }

  disableSkill() {
    this.tags.push("disableSkill");
    return this;
  }
  shield(initial: number, recreateMax?: number) {
    this.tags.push("shield");
    this.shieldConfig = {
      initial: initial,
      recreateMax: recreateMax ?? Infinity,
    };
    const originalDamageHandler = this.handlers.onBeforeDamaged;
    this
      .withThis({ [SHIELD_VALUE]: initial })
      .on("beforeDamaged", (c) => {
        if (originalDamageHandler) {
          originalDamageHandler(c);
        }
        if (!c.this.master) {
          // 出战护盾只保护出战角色
          if (!c.target.isActive()) {
            return false;
          }
        }
        const deducted = Math.min(c.value, c.this[SHIELD_VALUE]);
        c.decreaseDamage(deducted);
        c.this[SHIELD_VALUE] -= deducted;
        if (c.this[SHIELD_VALUE] === 0) {
          c.this.dispose();
        }
      });
    return this;
  }
  prepare(skill: SkillHandle): this;
  prepare(status: StatusHandle, round: number): this;
  prepare(skillOrStatus: SkillHandle | StatusHandle, round: number = 1) {
    this.prepareConfig = { skillOrStatus, round };
    return this;
  }

  build(): BuildFromCard extends true ? CardHandle & StatusHandle : StatusHandle {
    registerStatus(this.id, {
      tags: this.tags,
      duration: this.duration,
      usage: this.usage,
      maxUsage: this.maxUsage,
      usagePerRound: this.usagePerRound,
      listenTo: this.listenTo,
      shield: this.shieldConfig,
      prepare: this.prepareConfig,
      handler: {
        handler: this.handlers,
        state: this.state ?? {}
      }
    });
    return this.id as CardHandle & StatusHandle;
  }
}

class SupportBuilder<ThisT = object> extends TriggerBuilderBase<ThisT & SupportContext<true>> {
  private type: SupportType = "other";
  constructor(private readonly id: number) {
    super();
  }

  withThis<NewThisT extends object>(state: NewThisT): SupportBuilder<NewThisT & SupportContext<true>> {
    if (this.state !== null) {
      throw new Error("Cannot set this twice");
    }
    this.state = state;
    return this as unknown as SupportBuilder<NewThisT & SupportContext<true>>;
  }

  setType(type: SupportType) {
    this.type = type;
    return this;
  }

  build(): SupportHandle {
    registerSupport(this.id, {
      type: this.type,
      usage: this.usage,
      usagePerRound: this.usagePerRound,
      duration: this.duration,
      listenTo: this.listenTo === "master" ? "my" : this.listenTo,
      handler: {
        handler: this.handlers,
        state: this.state ?? {}
      }
    })
    return this.id as SupportHandle;
  }
}

class EquipmentBuilder<ThisT = object> extends TriggerBuilderBase<ThisT & EquipmentContext<true>> {
  private type: EquipmentType = "other";
  constructor(private readonly id: number) {
    super();
  }

  withThis<NewThisT extends object>(state: NewThisT): EquipmentBuilder<NewThisT & EquipmentContext<true>> {
    if (this.state !== null) {
      throw new Error("Cannot set this twice");
    }
    this.state = state;
    return this as unknown as EquipmentBuilder<NewThisT & EquipmentContext<true>>;
  }

  setType(type: EquipmentType) {
    this.type = type;
    return this;
  }
  override withDuration(duration: number): never {
    throw new Error("Cannot set duration for equipment");
  }
  override withUsage(usage: number, maxUsage?: number): never {
    throw new Error("Cannot set usage for equipment");
  }

  build(): EquipmentHandle {
    registerEquipment(this.id, {
      type: this.type,
      usagePerRound: this.usagePerRound,
      listenTo: this.listenTo,
      handler: {
        handler: this.handlers,
        state: this.state ?? {}
      }
    });
    return this.id as EquipmentHandle;
  }
}

class SummonBuilder<ThisT> extends TriggerBuilderBase<ThisT & SummonContext<true>> {
  private disposeWhenUsedUp = true;
  constructor(private readonly id: number) {
    super();
  }

  withThis<NewThisT extends object>(state: NewThisT): SummonBuilder<NewThisT & SummonContext<true>> {
    if (this.state !== null) {
      throw new Error("Cannot set this twice");
    }
    this.state = state;
    return this as unknown as SummonBuilder<NewThisT & SummonContext<true>>;
  }

  noDispose() {
    this.disposeWhenUsedUp = false;
    return this;
  }

  build(): SummonHandle {
    registerSummon(this.id, {
      usage: this.usage,
      maxUsage: this.maxUsage,
      disposeWhenUsedUp: this.disposeWhenUsedUp,
      listenTo: this.listenTo === "master" ? "my" : this.listenTo,
      handler: {
        handler: this.handlers,
        state: this.state ?? {}
      }
    })
    return this.id as SummonHandle;
  }
}

function factoryOf<const T, const Args extends unknown[]>(
  ctor: new (...args: Args) => T
) {
  return (...args: Args) => new ctor(...args);
}

export const createCharacter = factoryOf(CharacterBuilder);
export const createSkill = factoryOf(SkillBuilder);
export const createCard = factoryOf(CardBuilder);
export const createStatus = factoryOf(StatusBuilder);
export const createEquipment = factoryOf(EquipmentBuilder);
export const createSupport = factoryOf(SupportBuilder);
export const createSummon = factoryOf(SummonBuilder);
