import { DamageType, DiceType } from "@gi-tcg/typings";
import {
  Context,
  DamageContext,
  SkillContext,
  SkillDescriptionContext,
  SwitchActiveContext,
  PlayCardContext,
  UseDiceContext,
} from "./contexts";
import { Target } from "./target";
import {
  BurstSkillInfo,
  NormalSkillInfo,
  PassiveSkillEvents,
  UseSkillAction,
  registerSkill,
} from "./skills";
import { EventHandlers } from "./events";
import {
  CardTag,
  CardTargetDescriptor,
  CardType,
  ContextOfTarget,
  PlayCardAction,
  PlayCardFilter,
  PlayCardTargetFilter,
  ShownOption,
  registerCard,
} from "./cards";
import { EquipmentType } from "./equipments";
import { CharacterTag, registerCharacter } from "./characters";
import { StatusEventHandlers, StatusTag, registerStatus } from "./statuses";
import { SupportType } from "./supports";

export type SkillType =
  | "normal"
  | "elemental"
  | "burst"
  | "prepare"
  | "passive";

export type CharacterHandle = number & { readonly _never: unique symbol };
export type SkillHandle = number & { readonly _never: unique symbol };
export type CardHandle = number & { readonly _never: unique symbol };
export type StatusHandle = number & { readonly _never: unique symbol };
export type SummonHandle = number & { readonly _never: unique symbol };
export type SupportHandle = CardHandle & { readonly _never2: unique symbol };
export type EquipmentHandle = CardHandle & { readonly _never2: unique symbol };

type CommonAction = (c: Context) => void;

class CharacterBuilder {
  private readonly tags: CharacterTag[] = [];
  private readonly skills: SkillHandle[] = [];
  constructor(private readonly id: number) {}

  addTags(...tags: CharacterTag[]) {
    this.tags.push(...tags);
    return this;
  }

  addSkills(...skills: SkillHandle[]) {
    this.skills.push(...skills);
    return this;
  }

  build(): CharacterHandle {
    registerCharacter(this.id, {
      tags: this.tags,
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
  costEnergy(count: number) {
    return this.addCost(DiceType.Energy, count);
  }
  dealDamage(value: number, type: DamageType, target?: Target) {
    this.pushAction((c) => c.dealDamage(value, type, target));
    return this;
  }
  heal(value: number, target?: Target) {
    this.pushAction((c) => c.heal(value, target));
    return this;
  }
  gainEnergy(value?: number, target?: Target) {
    this.pushAction((c) => c.gainEnergy(value, target));
    return this;
  }
  lossEnergy(value?: number, target?: Target) {
    this.pushAction((c) => c.lossEnergy(value, target));
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
  // createSupport(support: SupportHandle) {}
  generateDice(...dice: DiceType[]) {
    this.pushAction((c) => c.generateDice(...dice));
    return this;
  }
  drawCards(count: number) {
    this.pushAction((c) => c.drawCards(count));
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
}

class SkillBuilder extends ActionBuilderBase {
  private type: SkillType = "normal";
  private actions: UseSkillAction[] = [];
  private passiveActions: PassiveSkillEvents = {};
  private currentEvent:
    | "battleBegin"
    | "switchActive"
    | "switchActiveFrom"
    | null = null;
  private prepareRound = 0;
  private shouldGainEnergy = false;

  constructor(private readonly id: number) {
    super();
  }
  protected override pushAction(action: CommonAction): void {
    this.actions.push(action);
  }

  setType(type: "normal" | "elemental", gainEnergy?: boolean): this;
  setType(type: "burst"): this;
  setType(type: "passive"): this;
  setType(type: "prepare", prepareRound: number): this;
  setType(type: SkillType, opt?: unknown): any {
    if (type === "prepare") {
      this.prepareRound = opt as number;
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

  onBattleBegin(action: CommonAction) {
    if (this.type !== "passive") {
      throw new Error("Only passive skill can use event handlers");
    }
    this.passiveActions.onBattleBegin = action;
    return this;
  }
  onSwitchActive(action: (c: SwitchActiveContext) => void) {
    if (this.type !== "passive") {
      throw new Error("Only passive skill can use event handlers");
    }
    this.passiveActions.onSwitchActive = action;
    return this;
  }
  onSwitchActiveFrom(action: (c: SwitchActiveContext) => void) {
    if (this.type !== "passive") {
      throw new Error("Only passive skill can use event handlers");
    }
    this.passiveActions.onSwitchActiveFrom = action;
    return this;
  }

  build(): SkillHandle {
    const action = (c: SkillDescriptionContext) => {
      for (const a of this.actions) {
        a(c);
      }
    };
    if (this.type === "prepare") {
      registerSkill(this.id, {
        type: "prepare",
        prepareRound: this.prepareRound,
        action,
      });
    } else if (this.type === "passive") {
      registerSkill(this.id, {
        type: "passive",
        actions: this.passiveActions,
      });
    } else {
      registerSkill(this.id, {
        type: this.type,
        gainEnergy: this.shouldGainEnergy,
        action,
      } as NormalSkillInfo | BurstSkillInfo);
    }
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

  private setType(type: CardType) {
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
  useSkill(skill: SkillHandle) {
    this.pushAction((c) => c.useSkill(skill));
    return this;
  }
  addFilter(filter: PlayCardFilter<T>) {
    this.filters.push(filter);
    return this;
  }
  addActiveCharacterFilter(ch: CharacterHandle) {
    return this.addFilter(
      (c) => !!c.hasCharacter(Target.ofCharacter(ch))?.isActive()
    );
  }
  filterTargets(filter: (...targets: ContextOfTarget<T>) => boolean) {
    this.targetFilters.push(filter);
    return this;
  }
  doWith(action: (this: ContextOfTarget<T>, c: PlayCardContext) => void) {
    this.pushAction(action);
    return this;
  }

  build(): CardHandle {
    const outerThis = this;
    function finalFilter(this: ContextOfTarget<T>, c: PlayCardContext) {
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
    function action(this: ContextOfTarget<T>, c: PlayCardContext) {
      for (const a of outerThis.actions) {
        a.call(this, c);
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

  buildToEquipment() {
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
      }
    }
    cardBuilder.doWith(function (c) {
      this[0].equip(cardBuilder.id as EquipmentHandle);
    });
    cardBuilder.build();
    return eqBuilder;
  }
}

type RemovePrefix<T extends string> = T extends `on${infer U}`
  ? Uncapitalize<U>
  : never;
type AddPrefix<T extends string> = `on${Capitalize<T>}`;
function capitalize<T extends string>(s: T): Capitalize<T> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
}
function addPrefix<T extends string>(event: T): AddPrefix<T> {
  return `on${capitalize(event)}`;
}

class TriggerBuilderBase<EH extends EventHandlers = EventHandlers> {
  protected handlers: EH = {} as EH;
  protected duration = Infinity;
  protected usage = Infinity;
  protected usagePerRound = Infinity;

  withDuration(duration: number) {
    this.duration = duration;
    return this;
  }
  withUsage(usage: number) {
    this.usage = usage;
    return this;
  }
  withUsagePerRound(usage: number) {
    this.usagePerRound = usage;
    return this;
  }

  on<E extends RemovePrefix<keyof EventHandlers>>(
    event: E,
    handler: EH[AddPrefix<E>]
  ) {
    const handlerName = addPrefix(event);
    if (this.handlers[handlerName]) {
      throw new Error(`Handler for event ${event} already exists`);
    }
    this.handlers[handlerName] = handler;
    return this;
  }
}

class StatusBuilder extends TriggerBuilderBase {
  private tags: StatusTag[] = [];
  private shouldListenToOthers: boolean = false;
  private handlerCtor?: new () => StatusEventHandlers;

  constructor(private readonly id: number) {
    super();
  }

  listenToOthers() {
    this.shouldListenToOthers = true;
    return this;
  }
  addTags(...tags: StatusTag[]) {
    this.tags.push(...tags);
    return this;
  }

  do<This extends {}>(handlers: StatusEventHandlers<This>, data?: This) {
    if (this.handlerCtor) {
      throw new Error("Multiple do() calls");
    }
    function ctor(this: any) {
      Object.assign(this, data);
    }
    Object.assign(ctor.prototype, handlers);
    this.handlerCtor = ctor as any;
    return this;
  }

  build(): StatusHandle {
    const ctor = this.handlerCtor ?? class {};
    if (this.handlers) {
      if (this.handlerCtor) {
        throw new Error("Cannot use both do() and on()");
      }
      Object.assign(ctor.prototype, this.handlers);
    }
    registerStatus(this.id, {
      tags: this.tags,
      duration: this.duration,
      usage: this.usage,
      usagePerRound: this.usagePerRound,
      listenToOthers: this.shouldListenToOthers,
      handlerCtor: ctor,
    });
    return this.id as StatusHandle;
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
    return this.id as SupportHandle;
  }
}

class EquipmentBuilder extends TriggerBuilderBase {
  private type: EquipmentType = "other";
  constructor(private readonly id: number) {
    super();
  }
  setType(type: EquipmentType) {
    this.type = type;
    return this;
  }

  build(): EquipmentHandle {
    // TODO
    return this.id as EquipmentHandle;
  }
}

class SummonBuilder extends TriggerBuilderBase {
  constructor(private readonly id: number) {
    super();
  }

  build(): SummonHandle {
    // TODO
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
const createEquipment = factoryOf(EquipmentBuilder);
const createSupport = factoryOf(SupportBuilder);
export const createSummon = factoryOf(SummonBuilder);
