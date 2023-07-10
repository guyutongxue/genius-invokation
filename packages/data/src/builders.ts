import { DamageType, DiceType } from "@gi-tcg/typings";
import { Context, SkillDescriptionContext, SwitchActiveContext } from "./contexts";
import { Target } from "./target";
import { BurstSkillInfo, NormalSkillInfo, UseSkillAction, registerSkill } from "./skills";
import { EventHandlers, EventHandlerCtor, ListenTarget } from "./events";
import { CardTag, CardTargetDescriptor, CardType, ContextOfTarget, PlayCardAction, PlayCardFilter, PlayCardTargetFilter, ShownOption, registerCard } from "./cards";
import { EquipmentType, registerEquipment } from "./equipments";
import { CharacterTag, registerCharacter } from "./characters";
import { PrepareConfig, ShieldConfig, StatusTag, registerStatus } from "./statuses";
import { SupportType, registerSupport } from "./supports";
import { registerSummon } from "./summons";
import { AddPrefix, RemovePrefix, addPrefix, capitalize } from "./utils";

export type SkillType =
  | "normal"
  | "elemental"
  | "burst"
  | "prepare"
  | "passive";

export type CharacterHandle = number & { readonly _never: unique symbol };
export type SkillHandle = number & { readonly _never: unique symbol };
export type CardHandle = number & { readonly _never: unique symbol };
export type StatusHandle = number & { readonly _never2: unique symbol };
export type SummonHandle = number & { readonly _never: unique symbol };
export type SupportHandle = CardHandle & { readonly _never2: unique symbol };
export type EquipmentHandle = CardHandle & { readonly _never2: unique symbol };

type CommonAction = (c: Context) => void;

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

class ActionBuilderBase {
  protected costs: DiceType[] = [];
  protected pushAction(action: CommonAction) {
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
  dealDamage(value: number, type: DamageType, target?: Target) {
    this.pushAction((c) => c.dealDamage(value, type, target));
    return this;
  }
  // applyElement
  heal(value: number, target: Target) {
    this.pushAction((c) => c.heal(value, target));
    return this;
  }
  gainEnergy(value?: number, target?: Target) {
    this.pushAction((c) => c.gainEnergy(value, target));
    return this;
  }
  lossEnergy(value?: number, target?: Target) {
    this.pushAction((c) => c.loseEnergy(value, target));
    return this;
  }
  createStatus(status: StatusHandle, target?: Target) {
    this.pushAction((c) => c.createStatus(status, target));
    return this;
  }
  removeStatus(status: StatusHandle, target?: Target) {
    this.pushAction((c) => c.removeStatus(status, target));
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
  summonOneOf(...summons: SummonHandle[]) {
    this.pushAction((c) => c.summonOneOf(...summons));
    return this;
  }
  // createSupport
  rollDice(count: number) {
    this.pushAction((c) => c.rollDice(count));
    return this;
  }
  generateDice(...dice: DiceType[]) {
    this.pushAction((c) => c.generateDice(...dice));
    return this;
  }
  // removeAllDice
  // getCardCount
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
  switchActive(target: Target) {
    this.pushAction((c) => c.switchActive(target));
    return this;
  }
  useSkill(skill: SkillHandle | "normal") {
    this.pushAction((c) => c.useSkill(skill));
    return this;
  }

}

class SkillBuilder extends ActionBuilderBase {
  private type: Exclude<SkillType, "passive"> = "normal";
  private actions: UseSkillAction[] = [];
  private shouldGainEnergy = false;

  constructor(private readonly id: number) {
    super();
  }
  protected override pushAction(action: CommonAction): void {
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

  do(action: UseSkillAction) {
    this.actions.push(action);
    return this;
  }

  build(): SkillHandle {
    const action = async (c: SkillDescriptionContext) => {
      for (const a of this.actions) {
        await a(c);
      }
    };
    registerSkill(this.id, {
      type: this.type,
      gainEnergy: this.shouldGainEnergy,
      action,
    } as NormalSkillInfo | BurstSkillInfo);
    return this.id as SkillHandle;
  }
}

class CardBuilder<
  const T extends CardTargetDescriptor = []
> extends ActionBuilderBase {
  private type: CardType = "event";
  private tags: CardTag[] = [];
  private shownOption: ShownOption = true;
  private filters: PlayCardFilter<T>[] = [];
  private targetFilters: PlayCardTargetFilter<T>[] = [];
  private actions: PlayCardAction[] = [];

  constructor(
    private readonly id: number,
    private readonly targetDescriptor?: T
  ) {
    super();
  }

  protected override pushAction(action: CommonAction) {
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
  addFilter(filter: PlayCardFilter<T>) {
    this.filters.push(filter);
    return this;
  }
  addCharacterFilter(ch: CharacterHandle, requireActive = true) {
    const self: unknown = this;
    CardBuilder.ensureTargetDescriptor(self);
    return self.addFilter(
      function (c) {
        return this[0].info.id === ch && (
          requireActive ? this[0].isActive() : true
        );
      }
    );
  }
  filterTargets(filter: (...targets: ContextOfTarget<T>) => boolean) {
    this.targetFilters.push(filter);
    return this;
  }
  do(action: (this: ContextOfTarget<T>, c: Context) => void) {
    this.pushAction(action);
    return this;
  }

  build(): CardHandle {
    const outerThis = this;
    function finalFilter(this: ContextOfTarget<T>, c: Context) {
      for (const f of outerThis.filters) {
        if (!f.call(this, c)) {
          return false;
        }
      }
      for (const f of outerThis.targetFilters) {
        if (!f(...this)) {
          return false;
        }
      }
      return true;
    }
    async function action(this: ContextOfTarget<T>, c: Context) {
      for (const a of outerThis.actions) {
        await a.call(this, c);
      }
    }
    registerCard(this.id, {
      type: this.type,
      costs: this.costs,
      tags: this.tags,
      showWhen: this.shownOption,
      filter: finalFilter as PlayCardFilter,
      action: action as PlayCardAction,
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
        cardBuilder.addFilter(function (c) {
          return this[0].info.tags.includes(weaponType);
        });
        eqBuilder.setType("weapon");
        break;
      }
    }
    if (cardBuilder.tags.includes("artifact")) {
      eqBuilder.setType("artifact");
    }
    cardBuilder.actions.unshift(function (c) {
      this[0].equip(cardBuilder.id as EquipmentHandle);
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

  buildToStatus(combatOrTarget: Target | "combat" | "this0" | undefined): StatusBuilder<true> {
    const statusBuilder = createStatus<true>(this.id);
    if (combatOrTarget === "combat") {
      this.do((c) => c.createCombatStatus(this.id as StatusHandle))
    } else if (combatOrTarget === "this0") {
      const id = this.id;
      const s = this as any;
      CardBuilder.ensureTargetDescriptor(s);
      s.do(function (c) { c.createStatus(id as StatusHandle, this[0].asTarget()); });
    } else {
      this.do((c) => c.createStatus(this.id as StatusHandle, combatOrTarget))
    }
    this.build();
    return statusBuilder;
  }
}

class TriggerBuilderBase {
  private perEventHandler: EventHandlers = {};
  private complexHandler: EventHandlerCtor | null = null;
  protected duration = Infinity;
  protected usage = Infinity;
  protected maxUsage = Infinity;
  protected usagePerRound = Infinity;

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

  on<E extends RemovePrefix<keyof EventHandlers>>(
    event: E,
    handler: EventHandlers[AddPrefix<E>]
  ) {
    const handlerName = addPrefix(event);
    if (this.perEventHandler[handlerName]) {
      throw new Error(`Handler for event ${event} already exists`);
    }
    this.perEventHandler[handlerName] = handler;
    return this;
  }

  do<This extends {}>(handlers: EventHandlers<This>, data?: This) {
    if (this.complexHandler) {
      throw new Error("Multiple do() calls");
    }
    function ctor(this: any) {
      Object.assign(this, data);
    }
    Object.assign(ctor.prototype, handlers);
    this.complexHandler = ctor as any;
    return this;
  }

  protected getHandlerCtor(): EventHandlerCtor {
    const ctor = this.complexHandler ?? class { };
    if (Object.keys(this.perEventHandler).length) {
      if (this.complexHandler) {
        throw new Error("Cannot use both do() and on()");
      }
      Object.assign(ctor.prototype, this.perEventHandler);
    }
    return ctor;
  }
}

class PassiveSkillBuilder extends TriggerBuilderBase {
  constructor(private readonly id: number) {
    super();
  }
  override withDuration(duration: number): never {
    throw new Error("Cannot set duration for passive skill");
  }
  override withUsage(usage: number): never {
    throw new Error("Cannot set usage for passive skill");
  }
  build(): SkillHandle {
    registerSkill(this.id, {
      type: "passive",
      duration: this.duration,
      // usage: this.usage,
      usagePerRound: this.usagePerRound,
      handlerCtor: this.getHandlerCtor(),
    });
    return this.id as SkillHandle;
  }
}

class StatusBuilder<BuildFromCard extends boolean = false> extends TriggerBuilderBase {
  private tags: StatusTag[] = [];
  private prepareConfig: PrepareConfig = null;
  private shieldConfig: ShieldConfig = null;
  private shouldListenToOthers: boolean = false;

  constructor(private readonly id: number) {
    super();
  }

  listenToOthers() {
    this.shouldListenToOthers = true;
    return this;
  }
  disableSkill() {
    this.tags.push("disableSkill");
    return this;
  }
  shield(shield: ShieldConfig) {
    this.tags.push("shield");
    this.shieldConfig = shield;
    return this;
  }
  prepare(skill: SkillHandle, round = 1) {
    this.prepareConfig = { skill, round };
    return this;
  }

  build(): BuildFromCard extends true ? CardHandle & StatusHandle : StatusHandle {
    registerStatus(this.id, {
      tags: this.tags,
      duration: this.duration,
      usage: this.usage,
      maxUsage: this.maxUsage,
      usagePerRound: this.usagePerRound,
      listenTo: this.shouldListenToOthers ? "my" : "master",
      shield: this.shieldConfig,
      prepare: this.prepareConfig,
      handlerCtor: this.getHandlerCtor(),
    });
    return this.id as CardHandle & StatusHandle;
  }
}

class SupportBuilder extends TriggerBuilderBase {
  private type: SupportType = "other";
  private shouldListenToOpp: boolean = false;
  constructor(private readonly id: number) {
    super();
  }

  setType(type: SupportType) {
    this.type = type;
    return this;
  }

  listenToOpp() {
    this.shouldListenToOpp = true;
    return this;
  }

  build(): SupportHandle {
    registerSupport(this.id, {
      type: this.type,
      usage: this.usage,
      usagePerRound: this.usagePerRound,
      duration: this.duration,
      listenTo: this.shouldListenToOpp ? "all" : "my",
      handlerCtor: this.getHandlerCtor(),
    })
    return this.id as SupportHandle;
  }
}

class EquipmentBuilder extends TriggerBuilderBase {
  private type: EquipmentType = "other";
  private listenTo: ListenTarget = "master";
  constructor(private readonly id: number) {
    super();
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
  listenToOther() {
    this.listenTo = "my";
    return this;
  }
  listenToOpp() {
    this.listenTo = "all";
    return this;
  }

  build(): EquipmentHandle {
    registerEquipment(this.id, {
      type: this.type,
      usagePerRound: this.usagePerRound,
      listenTo: this.listenTo,
      handlerCtor: this.getHandlerCtor(),
    });
    return this.id as EquipmentHandle;
  }
}

class SummonBuilder extends TriggerBuilderBase {
  private disposeWhenUsedUp = true;
  constructor(private readonly id: number) {
    super();
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
      handlerCtor: this.getHandlerCtor(),
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
