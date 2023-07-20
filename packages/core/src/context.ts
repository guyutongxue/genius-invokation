import {
  CardInfoWithId,
  CardTag,
  CardTarget,
  CharacterContext,
  CharacterInfoWithId,
  Context,
  ContextOfEvent,
  DamageContext,
  RollContext,
  ElementalReactionContext,
  EquipmentInfoWithId,
  EventHandlerNames,
  PlayCardContext,
  SkillContext,
  SkillDescriptionContext,
  SkillInfoWithId,
  SpecialBits,
  StatusContext,
  StatusInfoWithId,
  SummonContext,
  SummonInfoWithId,
  SwitchActiveContext,
  Target,
  TargetInfo,
  UseDiceContext,
  getSkill,
  getTargetInfo,
  ListenTarget,
  PlayCardFilter,
  makeReaction,
  REACTION_MAP,
  SkillDamageContext,
  RequestFastSwitchContext,
} from "@gi-tcg/data";
import { flip } from "@gi-tcg/utils";
import { GameState } from "./state.js";
import { Aura, DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import { CharacterPosition, Player } from "./player.js";
import { Character } from "./character.js";
import { Equipment } from "./equipment.js";
import { Status } from "./status.js";
import { Summon } from "./summon.js";
import { Card } from "./card.js";
import { Entity } from "./entity.js";
import { ActionConfig, PlayCardTargetObj } from "./action.js";
import { Support } from "./support.js";
import { PassiveSkill } from "./passive_skill.js";
import { Skill } from "./skill.js";
import { Damage } from "./damage.js";

type EventAndContext<E extends EventHandlerNames = EventHandlerNames> = [
  event: E,
  ctx: ContextOfEvent<E>
];
export type EventFactory = (entityId: number) => EventAndContext[];

export class ContextImpl implements Context {
  constructor(
    protected state: GameState,
    public readonly who: 0 | 1,
    public readonly sourceId: number
  ) {}

  get currentPhase(): "action" | "end" | "other" {
    const phase = this.state.getPhase();
    if (phase === "action" || phase === "end") {
      return phase;
    } else {
      return "other";
    }
  }
  get currentTurn(): number {
    return this.state.getCurrentTurn();
  }
  isMyTurn(): boolean {
    return this.currentTurn === this.who;
  }
  checkSpecialBit(bit: SpecialBits): boolean {
    return this.state.getPlayer(this.who).getSpecialBit(bit);
  }

  protected createCharacterContext(ch: Character): CharacterContextImpl {
    return new CharacterContextImpl(this.state, this.who, ch, this.sourceId);
  }
  protected createSummonContext(s: Summon): SummonContextImpl {
    return new SummonContextImpl(this.state, this.who, s);
  }
  private getCharacterFromTarget(
    t: Target | TargetInfo
  ): CharacterContextImpl[] {
    const info = t instanceof Target ? getTargetInfo(t) : t;
    switch (info.type) {
      case "byPos": {
        const player = this.state.getPlayer(
          info.opp ? flip(this.who) : this.who
        );
        let positions: CharacterPosition[];
        if (info.pos === "all") {
          positions = ["prev", "active", "next"];
        } else if (info.pos === "standby") {
          positions = ["prev", "next"];
        } else {
          positions = [info.pos];
        }
        const characters = new Set(
          positions.map((pos) => player.getCharacter(pos))
        );
        return [...characters].map(this.createCharacterContext.bind(this));
      }
      case "oneEnergyNotFull": {
        const player = this.state.getPlayer(this.who);
        const try1 = player.getCharacter("active");
        if (!try1.fullEnergy()) return [this.createCharacterContext(try1)];
        const try2 = player.getCharacter("next");
        if (!try2.fullEnergy()) return [this.createCharacterContext(try2)];
        const try3 = player.getCharacter("prev");
        if (!try3.fullEnergy()) return [this.createCharacterContext(try3)];
        return [];
      }
      case "byEntityId": {
        const character = this.state
          .getPlayer(this.who)
          .getCharacterById(info.entityId);
        const character2 = this.state
          .getPlayer(flip(this.who))
          .getCharacterById(info.entityId);
        return character
          ? [this.createCharacterContext(character)]
          : character2
          ? [this.createCharacterContext(character2)]
          : [];
      }
      case "byId": {
        const player = this.state.getPlayer(
          info.opp ? flip(this.who) : this.who
        );
        const character = player.getCharacterById(info.id, true);
        return character ? [this.createCharacterContext(character)] : [];
      }
      case "recentOpp": {
        const relativeCtx = this.getCharacterFromTarget(info.relativeTo);
        if (relativeCtx.length === 0) return [];
        const relative = relativeCtx[0];
        const targetPlayer = this.state.getPlayer(flip(relative.who));
        const targetCharacter = targetPlayer.getCharacterByPos(
          relative.indexOfPlayer()
        );
        return [this.createCharacterContext(targetCharacter)];
      }
      default: {
        const _: never = info;
        throw new Error(`Unknown target info type: ${_}`);
      }
    }
  }

  hasCharacter(ch: number | Target): CharacterContext | null {
    const t: Target =
      typeof ch === "number" ? Target.ofCharacter(ch as any) : ch;
    const ctx = this.getCharacterFromTarget(t);
    if (ctx.length === 0) return null;
    return ctx[0];
  }
  allCharacters(
    opp?: boolean | undefined,
    includesDefeated?: boolean | undefined
  ): CharacterContext[] {
    let characters = this.state.getPlayer(
      opp ? flip(this.who) : this.who
    ).characters;
    if (!includesDefeated) {
      characters = characters.filter((ch) => ch.isAlive());
    }
    return characters.map(this.createCharacterContext.bind(this));
  }
  fullSupportArea(opp: boolean): boolean {
    const player = this.state.getPlayer(opp ? flip(this.who) : this.who);
    return player.fullSupportArea();
  }
  hasSummon(summon: number): SummonContext | null {
    const s = this.state
      .getPlayer(this.who)
      .summons.find((s) => s.info.id === summon);
    return s ? this.createSummonContext(s) : null;
  }
  allSummons(includeOpp = false): SummonContext[] {
    const mySummons = this.state.getPlayer(this.who).summons;
    const oppSummons = includeOpp
      ? this.state.getPlayer(flip(this.who)).summons
      : [];
    return [...mySummons, ...oppSummons].map(
      this.createSummonContext.bind(this)
    );
  }

  hasCombatStatus(status: number): StatusContext | null {
    const combatStatuses = this.state.getPlayer(this.who).combatStatuses;
    const s = combatStatuses.find((s) => s.info.id === status);
    return s ? new StatusContextImpl(s) : null;
  }
  hasCombatShield(): StatusContext | null {
    const combatStatuses = this.state.getPlayer(this.who).combatStatuses;
    const s = combatStatuses.find((s) => s.shield !== null);
    return s ? new StatusContextImpl(s) : null;
  }

  dealDamage(
    value: number,
    type: DamageType,
    target?: Target | undefined
  ): void {
    const chs = this.getCharacterFromTarget(target ?? Target.oppActive());
    for (const ch of chs) {
      this.state.dealDamage(this.sourceId, ch.character, value, type);
    }
  }
  applyElement(type: DamageType, target?: Target): void {
    // TODO
    throw new Error("Shouldn't called by base class");
  }
  heal(value: number, target: Target): void {
    const ctx = this.getCharacterFromTarget(target);
    for (const ch of ctx) {
      ch.heal(value);
    }
  }
  gainEnergy(value?: number | undefined, target?: Target): number {
    target ??= Target.myActive();
    const ctx = this.getCharacterFromTarget(target);
    let sum = 0;
    for (const ch of ctx) {
      sum += ch.gainEnergy(value ?? 0);
    }
    return sum;
  }
  loseEnergy(value?: number | undefined, target?: Target): number {
    target ??= Target.myActive();
    const ctx = this.getCharacterFromTarget(target);
    let sum = 0;
    for (const ch of ctx) {
      sum += ch.loseEnergy(value ?? 0);
    }
    return sum;
  }

  createStatus(status: number, target?: Target): StatusContext {
    target ??= Target.myActive();
    const ctx = this.getCharacterFromTarget(target);
    if (ctx.length !== 1) {
      throw new Error(
        `Expected to create status on exactly one character, but got ${ctx.length}`
      );
    }
    return ctx[0].createStatus(status);
  }
  removeStatus(status: number, target?: Target): boolean {
    target ??= Target.myActive();
    const ctx = this.getCharacterFromTarget(target);
    let removed = false;
    for (const ch of ctx) {
      removed ||= ch.removeStatus(status);
    }
    return removed;
  }
  createCombatStatus(status: number, opp: boolean = false): StatusContext {
    const player = this.state.getPlayer(opp ? flip(this.who) : this.who);
    const st = player.createCombatStatus(status);
    this.state.pushEvent(createEnterEventContext(this.state, this.who, st));
    return new StatusContextImpl(st);
  }

  summon(summon: number): void {
    const summonObj = new Summon(summon);
    this.state.getPlayer(this.who).summons.push(summonObj);
    this.state.pushEvent(
      createEnterEventContext(this.state, this.who, summonObj)
    );
  }
  summonOneOf(...summons: number[]): void {
    const summon = summons[Math.floor(Math.random() * summons.length)];
    this.summon(summon);
  }
  createSupport(support: number, opp?: boolean | undefined): void {
    const supportObj = new Support(support);
    const player = this.state.getPlayer(opp ? flip(this.who) : this.who);
    player.supports.push(supportObj);
    this.state.pushEvent(
      createEnterEventContext(this.state, this.who, supportObj)
    );
  }

  getDice(): DiceType[] {
    return this.state.getPlayer(this.who).dice;
  }
  rollDice(count: number): Promise<void> {
    return this.state.getPlayer(this.who).rerollDice(count);
  }
  generateDice(...dice: DiceType[]): void {
    const player = this.state.getPlayer(this.who);
    player.dice.push(...dice);
    player.sortDice();
  }
  generateRandomElementDice(count: number = 1): void {
    const newDice: DiceType[] = [];
    while (newDice.length < count) {
      const dice = Math.floor(Math.random() * 7) + 1;
      if (!newDice.includes(dice)) {
        newDice.push(dice);
      }
    }
    this.generateDice(...newDice);
  }
  removeAllDice(): DiceType[] {
    const old = this.state.getPlayer(this.who).dice;
    this.state.getPlayer(this.who).dice = [];
    return old;
  }

  getCardCount(opp?: boolean | undefined): number {
    return this.state.getPlayer(opp ? flip(this.who) : this.who).hands.length;
  }
  drawCards(
    count: number,
    opp?: boolean | undefined,
    tag?: CardTag | undefined
  ): void {
    const player = this.state.getPlayer(opp ? flip(this.who) : this.who);
    const controlled = tag ? player.cardsWithTagFromPile(tag) : [];
    player.drawHands(count, controlled);
  }
  createCards(...ids: number[]): void {
    const cards = ids.map((id) => new Card(id));
    this.state.getPlayer(this.who).hands.push(...cards);
  }
  switchCards(): Promise<void> {
    return this.state.getPlayer(this.who).switchHands();
  }

  switchActive(target: Target): void {
    const ctx = this.getCharacterFromTarget(target);
    if (ctx.length === 0) {
      throw new Error(`Switching active: Target not exists: ${target}`);
    }
    const chCtx = ctx[0];
    const player = this.state.getPlayer(
      chCtx.isMine() ? this.who : flip(this.who)
    );
    player.switchActive(chCtx.entityId);
  }
  useSkill(skill: number | "normal"): Promise<void> {
    const player = this.state.getPlayer(this.who);
    const ch = player.getCharacter("active");
    let skillObj: Skill | undefined;
    if (skill === "normal") {
      skillObj = ch.skills.find((sk) => sk.info.type === "normal");
    } else {
      skillObj = ch.skills.find((sk) => sk.info.id === skill);
    }
    if (!skillObj) {
      throw new Error("NO normal attack defined for active ch");
    }
    return player.useSkill(skillObj, this.sourceId);
  }

  actionAgain(): void {
    this.state.getPlayer(flip(this.who)).setSpecialBit(SpecialBits.SkipTurn);
  }

  getMaster(): CharacterContext {
    throw new Error("Cannot call getMaster in raw Context");
  }
  asStatus(): StatusContext {
    throw new Error("This context is not a status");
  }
  dispose(): void {
    const env = getEntityById(this.state, this.sourceId);
    if (!env) return;
    if (
      env.entity instanceof Status ||
      env.entity instanceof Support ||
      env.entity instanceof Summon
    ) {
      env.entity.shouldDispose = true;
    } else {
      throw new Error("This entity cannot be disposed this way.");
    }
  }
}

class CharacterContextImpl implements CharacterContext {
  constructor(
    private state: GameState,
    public readonly who: 0 | 1,
    public character: Character,
    public readonly sourceId = character.entityId
  ) {}
  get entityId() {
    return this.character.entityId;
  }
  get info(): CharacterInfoWithId {
    return this.character.info;
  }
  get health() {
    return this.character.health;
  }
  get energy() {
    return this.character.energy;
  }
  get aura() {
    return this.character.applied;
  }
  isAlive() {
    return this.character.isAlive();
  }

  indexOfPlayer() {
    return this.state
      .getPlayer(this.who)
      .characters.findIndex((c) => c.entityId === this.entityId);
  }

  hasEquipment(
    equipment: number | "artifact" | "weapon"
  ): EquipmentInfoWithId | null {
    let eq: Equipment | undefined;
    if (typeof equipment === "number") {
      eq = this.character.equipments.find((e) => e.info.id === equipment);
    } else {
      eq = this.character.equipments.find((e) => e.info.type === equipment);
    }
    return eq?.info ?? null;
  }
  equip(equipment: number | EquipmentInfoWithId): void {
    const eqId = typeof equipment === "number" ? equipment : equipment.id;
    const eq = new Equipment(eqId);
    this.character.equipments.push(eq);
    this.state.pushEvent(createEnterEventContext(this.state, this.who, eq));
  }
  removeEquipment(equipment: number | EquipmentInfoWithId): void {
    const eqId = typeof equipment === "number" ? equipment : equipment.id;
    this.character.equipments = this.character.equipments.filter(
      (e) => e.info.id !== eqId
    );
  }

  heal(amount: number): void {
    if (this.character.health === 0) {
      this.character.revive();
    }
    this.state.heal(this.character, amount, this.sourceId);
  }
  gainEnergy(amount: number): number {
    return this.character.gainEnergy(amount);
  }
  loseEnergy(amount: number): number {
    const oldEnergy = this.character.energy;
    this.character.energy = Math.max(this.character.energy - amount, 0);
    return oldEnergy - this.character.energy;
  }
  createStatus(status: number): StatusContext {
    const st = this.character.createStatus(status);
    this.state.pushEvent(createEnterEventContext(this.state, this.who, st));
    return new StatusContextImpl(st);
  }
  removeStatus(status: number): boolean {
    const st = this.character.statuses.findIndex((s) => s.info.id === status);
    if (st === -1) return false;
    this.character.statuses.splice(st, 1);
    return true;
  }
  hasStatus(status: number): StatusContext | null {
    const st = this.character.statuses.find((s) => s.info.id === status);
    if (!st) return null;
    return new StatusContextImpl(st);
  }
  hasShield(): StatusContext {
    const st = this.character.statuses.find((s) => s.shield !== null);
    if (!st) throw new Error("No shield");
    return new StatusContextImpl(st);
  }

  isActive() {
    return (
      this.state.getPlayer(this.who).getCharacter("active").entityId ===
        this.entityId ||
      this.state.getPlayer(flip(this.who)).getCharacter("active").entityId ===
        this.entityId
    );
  }
  isMine() {
    return !!this.state
      .getPlayer(this.who)
      .characters.find((c) => c.entityId === this.entityId);
  }
  asTarget(): Target {
    return Target.byEntityId(this.entityId);
  }
  elementType(): DiceType {
    return this.character.elementType();
  }
}

export class StatusContextImpl implements StatusContext {
  constructor(private status: Status) {}

  get entityId() {
    return this.status.entityId;
  }

  get info(): StatusInfoWithId {
    return this.status.info;
  }

  getVisibleValue(): number | null {
    return this.status.visibleValue;
  }
  addVisibleValue(added: number): number {
    const v = this.status.visibleValue ?? 0;
    return (this.status.visibleValue = v + added);
  }

  gainUsage() {
    this.status.usage++;
  }
  gainShield(value: number): void {
    if (this.status.shield === null) {
      return;
    }
    this.status.shield += value;
  }
}

export class ContextWithMasterImpl extends ContextImpl {
  constructor(
    state: GameState,
    who: 0 | 1,
    private master: Character | null,
    private status: Status | Equipment | PassiveSkill,
    public readonly sourceId = status.entityId
  ) {
    super(state, who, sourceId);
  }
  override createStatus(
    status: number,
    target?: Target | undefined
  ): StatusContext {
    if (typeof target !== "undefined" || this.master === null) {
      return super.createStatus(status, target);
    }
    // 调整角色状态的“附属状态”为附属到本角色上
    const adjustedTarget = this.createCharacterContext(this.master).asTarget();
    return super.createStatus(status, adjustedTarget);
  }
  override getMaster() {
    if (this.master === null) {
      throw new Error("Master not exists; maybe this is a combat status");
    }
    return this.createCharacterContext(this.master);
  }
  override asStatus() {
    if (this.status instanceof Status) {
      return new StatusContextImpl(this.status);
    } else {
      return super.asStatus();
    }
  }
}

export class SummonContextImpl implements SummonContext {
  constructor(
    private state: GameState,
    private readonly who: 0 | 1,
    private summon: Summon
  ) {}

  get entityId() {
    return this.summon.entityId;
  }

  get info(): SummonInfoWithId {
    return this.summon.info;
  }

  isMine() {
    return !!this.state
      .getPlayer(this.who)
      .summons.find((s) => s.entityId === this.entityId);
  }

  get usage() {
    return this.summon.getUsage();
  }
  set usage(value: number) {
    this.summon.setUsage(value);
  }

  dispose() {
    this.summon.shouldDispose = true;
  }
}

class SwitchActiveContextImpl
  extends ContextImpl
  implements SwitchActiveContext
{
  from: CharacterContext;
  to: CharacterContext;
  constructor(
    state: GameState,
    who: 0 | 1,
    sourceId: number,
    from: Character,
    to: Character
  ) {
    super(state, who, sourceId);
    this.from = this.createCharacterContext(from);
    this.to = this.createCharacterContext(to);
  }
}

export class UseDiceContextImpl extends ContextImpl implements UseDiceContext {
  switchActiveCtx?: SwitchActiveContext;
  useSkillCtx?: SkillContext;
  playCardCtx?: PlayCardContext;

  constructor(
    state: GameState,
    who: 0 | 1,
    sourceId: number,
    private action: ActionConfig
  ) {
    super(state, who, sourceId);
    switch (action.type) {
      case "switchActive": {
        this.switchActiveCtx = new SwitchActiveContextImpl(
          state,
          who,
          sourceId,
          action.from,
          action.to
        );
        break;
      }
      case "useSkill": {
        this.useSkillCtx = new SkillContextImpl(
          state,
          who,
          sourceId,
          action.skill
        );
        break;
      }
      case "playCard": {
        this.playCardCtx = new PlayCardContextImpl(
          state,
          who,
          action.card,
          action.targets
        );
      }
    }
  }

  addCost(...dice: DiceType[]): void {
    if ("dice" in this.action) {
      this.action.dice.push(...dice);
    }
  }
  deductCost(...dice: DiceType[]): void {
    if ("dice" in this.action) {
      for (const d of dice) {
        let i;
        if (d === DiceType.Omni) {
          i = this.action.dice.findIndex((d) => d !== DiceType.Void);
        } else {
          i = this.action.dice.indexOf(d);
        }
        if (i !== -1) {
          this.action.dice.splice(i, 1);
        }
      }
    }
  }
}

export class SkillDescriptionContextImpl
  extends ContextImpl
  implements SkillDescriptionContext
{
  constructor(
    state: GameState,
    who: 0 | 1,
    sourceId: number,
    protected skill: Skill | PassiveSkill
  ) {
    super(state, who, sourceId);
  }

  get character() {
    const player = this.state.getPlayer(this.who);
    const ch = player.characters.find((ch) =>
      ch.info.skills.includes(this.skill.info.id)
    );
    if (!ch) throw new Error("Character not found");
    return this.createCharacterContext(ch);
  }
  get target() {
    const player = this.state.getPlayer(flip(this.who));
    const ch = player.getCharacter("active");
    return this.createCharacterContext(ch);
  }

  triggeredByCard(card: number): PlayCardContext | null {
    const ctx = getContextById(this.state, this.sourceId);
    if (ctx instanceof PlayCardContextImpl) {
      if (ctx.card.info.id === card) {
        return ctx;
      }
    }
    return null;
  }
  triggeredByStatus(status: number): StatusContext | null {
    const ctx = getContextById(this.state, this.sourceId);
    if (ctx instanceof StatusContextImpl) {
      if (ctx.info.id === status) {
        return ctx;
      }
    }
    return null;
  }

  isCharged(): boolean {
    const player = this.state.getPlayer(this.who);
    const bit = player.dice.length % 2 === 0;
    return bit && this.skill.info.type === "normal";
  }
  isPlunging(): boolean {
    const player = this.state.getPlayer(this.who);
    const bit = player.getSpecialBit(SpecialBits.Plunging);
    return bit && this.skill.info.type === "normal";
  }
}

export class SkillContextImpl
  extends SkillDescriptionContextImpl
  implements SkillContext
{
  get info() {
    return this.skill.info;
  }

  getAllDescendingDamages(): DamageContext[] {
    return this.state.damageLog.map(
      ([dmg]) => new DamageContextImpl(this.state, this.who, 0, dmg)
    );
  }
  getAllDescendingReactions(): ElementalReactionContext[] {
    return this.state.reactionLog.map(
      ([_, id, reaction]) =>
        new ElementalReactionContextImpl(this.state, this.who, id, reaction)
    );
  }
}

export class PlayCardContextImpl
  extends ContextImpl
  implements PlayCardContext
{
  targetCtxs: CardTarget[keyof CardTarget][] = [];

  constructor(
    state: GameState,
    who: 0 | 1,
    public readonly card: Card,
    private readonly targetObj: PlayCardTargetObj[]
  ) {
    super(state, who, card.entityId);
    for (const obj of this.targetObj) {
      if (obj instanceof Character) {
        this.targetCtxs.push(this.createCharacterContext(obj));
      } else if (obj instanceof Summon) {
        this.targetCtxs.push(this.createSummonContext(obj));
      } else {
        console.error(obj);
        throw new Error(`Unknown target object: ${obj}`);
      }
    }
  }
  get info(): CardInfoWithId {
    return this.card.info;
  }
  get target(): CardTarget[keyof CardTarget][] {
    return this.targetCtxs;
  }

  enabled() {
    // @ts-expect-error TS Sucks
    const result = this.card.info.filter.call(this.targetCtxs, this);
    return result;
  }

  isTalentOf(charId: number): boolean {
    return (
      this.card.info.tags.includes("talent") &&
      !!this.targetObj.find(
        (ch) => ch instanceof Character && ch.info.id === charId
      )
    );
  }
  isWeapon(): boolean {
    const weaponTags: CardTag[] = [
      "weaponBow",
      "weaponCatalyst",
      "weaponClaymore",
      "weaponPole",
      "weaponSword",
    ];
    return this.card.info.tags.some((t) => weaponTags.includes(t));
  }
}

export interface RollPhaseConfig {
  controlled: DiceType[];
  times: number;
}

class RollContextImpl implements RollContext {
  constructor(private player: Player, private config: RollPhaseConfig) {}

  get activeCharacterElement() {
    const ch = this.player.getCharacter("active");
    return ch.elementType();
  }

  fixDice(...dice: DiceType[]): void {
    this.config.controlled.push(...dice);
  }

  addRerollCount(count: number): void {
    this.config.times += count;
  }
}

class ElementalReactionContextImpl
  extends ContextImpl
  implements ElementalReactionContext
{
  constructor(
    state: GameState,
    who: 0 | 1,
    sourceId: number,
    private reaction: Reaction
  ) {
    super(state, who, sourceId);
  }
  get reactionType() {
    return this.reaction;
  }

  relatedWith(d: DamageType): boolean {
    const aura = d as number as Aura;
    if (!(aura in REACTION_MAP)) return false;
    return !!Object.values(REACTION_MAP[aura]).find(
      ([a, r]) => r === this.reaction
    );
  }
  swirledElement():
    | DamageType.Cryo
    | DamageType.Hydro
    | DamageType.Pyro
    | DamageType.Electro
    | null {
    switch (this.reaction) {
      case Reaction.SwirlCryo:
        return DamageType.Cryo;
      case Reaction.SwirlHydro:
        return DamageType.Hydro;
      case Reaction.SwirlPyro:
        return DamageType.Pyro;
      case Reaction.SwirlElectro:
        return DamageType.Electro;
      default:
        return null;
    }
  }
}

export class DamageContextImpl extends ContextImpl implements DamageContext {
  constructor(
    state: GameState,
    who: 0 | 1,
    public sourceId: number,
    private damage: Damage
  ) {
    super(state, who, sourceId);
  }

  getSource() {
    const srcId = this.damage.sourceId;
    return getContextById(this.state, srcId);
  }

  get sourceSummon() {
    const ctx = this.getSource();
    if (ctx instanceof SummonContextImpl) {
      return ctx;
    } else {
      return undefined;
    }
  }

  get sourceSkill() {
    const ctx = this.getSource();
    if (ctx instanceof SkillContextImpl) {
      return ctx;
    } else {
      return undefined;
    }
  }

  get sourceReaction() {
    const reaction = this.damage.triggeredByReaction;
    if (typeof reaction === "undefined") {
      return undefined;
    }
    const sourceId = this.damage.sourceId;
    const { who } = getEntityById(this.state, sourceId)!;
    return new ElementalReactionContextImpl(
      this.state,
      who,
      sourceId,
      reaction
    );
  }

  get target() {
    return this.createCharacterContext(this.damage.target);
  }

  get damageType() {
    return this.damage.getType();
  }

  get value() {
    return this.damage.getValue();
  }

  get reaction(): ElementalReactionContextImpl | null {
    const type = this.damageType;
    if (type === DamageType.Heal) {
      throw new Error("Should not contain heal in damage context");
    }
    if (type === DamageType.Piercing || type === DamageType.Physical) {
      return null;
    }
    const reaction = makeReaction(this.damage.target.applied, type)[1];
    if (reaction === null) {
      return null;
    }
    return new ElementalReactionContextImpl(
      this.state,
      this.who,
      this.sourceId,
      reaction
    );
  }

  changeDamageType(type: DamageType) {
    this.damage.changedLogs.push([this.sourceId, type]);
  }
  addDamage(value: number): void {
    this.damage.addedLogs.push([this.sourceId, value]);
  }
  multiplyDamage(value: number): void {
    this.damage.multipliedLogs.push([this.sourceId, value]);
  }
  decreaseDamage(value: number): void {
    this.damage.decreasedLogs.push([this.sourceId, value]);
  }
}

class SkillDamageContextImpl
  extends DamageContextImpl
  implements SkillDamageContext
{
  private getSkillCtx() {
    const ctx = this.getSource();
    if (ctx instanceof SkillContextImpl) {
      return ctx;
    } else {
      throw new Error("Damage source is not a skill");
    }
  }
  get skillInfo(): SkillInfoWithId {
    return this.getSkillCtx().info;
  }
  get characterInfo(): CharacterInfoWithId {
    return this.getSkillCtx().character.info;
  }
  isCharged(): boolean {
    return this.getSkillCtx().isCharged();
  }
  isPlunging(): boolean {
    return this.getSkillCtx().isPlunging();
  }
}

export interface RequestFastToken {
  resolved: boolean;
}

class RequestFastSwitchContextImpl
  extends ContextImpl
  implements RequestFastSwitchContext
{
  constructor(
    state: GameState,
    who: 0 | 1,
    sourceId: number,
    private token: RequestFastToken
  ) {
    super(state, who, sourceId);
  }
  requestFast(condition?: boolean | undefined): void {
    if (this.token.resolved) {
      console.warn(
        "You are calling requestFast TWICE. This might be an error!"
      );
    }
    if (typeof condition === "undefined" || condition === true) {
      this.token.resolved = true;
    }
  }
}

interface EntityEnv {
  who: 0 | 1;
  master?: Character;
  entity: Entity;
  listenTo: ListenTarget;
}

export function getEntityById(
  state: GameState,
  entityId: number
): EntityEnv | null {
  for (const who of [0, 1] as const) {
    const player = state.getPlayer(who);
    for (const ch of player.characters) {
      const passive = ch.passiveSkills.find((s) => s.entityId === entityId);
      if (passive) {
        return { who, master: ch, entity: passive, listenTo: "master" };
      }
      const skill = ch.skills.find((s) => s.entityId === entityId);
      if (skill) {
        return { who, master: ch, entity: skill, listenTo: "master" };
      }
      const equip = ch.equipments.find((s) => s.entityId === entityId);
      if (equip) {
        return {
          who,
          master: ch,
          entity: equip,
          listenTo: equip.info.listenTo,
        };
      }
      const status = ch.statuses.find((s) => s.entityId === entityId);
      if (status) {
        return {
          who,
          master: ch,
          entity: status,
          listenTo: status.info.listenTo,
        };
      }
    }
    const combatStatus = player.combatStatuses.find(
      (s) => s.entityId === entityId
    );
    if (combatStatus) {
      return {
        who,
        entity: combatStatus,
        listenTo: combatStatus.info.listenTo,
      };
    }
    const summon = player.summons.find((s) => s.entityId === entityId);
    if (summon) {
      return { who, entity: summon, listenTo: "my" };
    }
    const support = player.supports.find((s) => s.entityId === entityId);
    if (support) {
      return { who, entity: support, listenTo: support.info.listenTo };
    }
    if (player.playingCard?.entityId === entityId) {
      return { who, entity: player.playingCard, listenTo: "my" };
    }
  }
  return null;
}

function getContextById(state: GameState, entityId: number) {
  const ee = getEntityById(state, entityId);
  if (ee === null) return null;
  const { who, entity: object } = ee;
  if (object instanceof PassiveSkill || object instanceof Skill) {
    return new SkillContextImpl(state, who, object.entityId, object);
  } else if (object instanceof Status) {
    return new StatusContextImpl(object);
  } else if (object instanceof Summon) {
    return new SummonContextImpl(state, who, object);
  } else if (object instanceof Card) {
    // FIXME targets 为空，因为确实无从得知
    return new PlayCardContextImpl(state, who, object, []);
  } else {
    return null;
  }
}

function createCommonEventContext(...events: EventHandlerNames[]) {
  return (
    state: GameState,
    sourceWho?: 0 | 1,
    sourceChar?: Character,
    sourceEntityId?: number
  ): EventFactory => {
    return (entityId: number) => {
      let ctx: ContextImpl;
      const env = getEntityById(state, entityId);
      if (env === null) return [];
      if (
        typeof sourceWho === "number" &&
        !checkShouldListen(env, sourceWho, sourceChar, sourceEntityId)
      ) {
        return [];
      }
      const { entity, master, who } = env;
      if (
        entity instanceof Status ||
        entity instanceof Equipment ||
        entity instanceof PassiveSkill
      ) {
        ctx = new ContextWithMasterImpl(state, who, master ?? null, entity);
      } else {
        ctx = new ContextImpl(state, who, entity.entityId);
      }
      return events.map((e) => [e, ctx]);
    };
  };
}

function checkShouldListen(
  entityEnv: EntityEnv,
  who?: 0 | 1,
  char?: Character,
  entity?: number
) {
  if (typeof entity === "number") {
    return entityEnv.entity.entityId === entity;
  }
  // Default of PassiveSkill, Equipment, Status
  if (entityEnv.listenTo === "master") {
    if (entityEnv.master && char) {
      return char.entityId === entityEnv.master.entityId;
    } else if (typeof who !== "undefined") {
      return who === entityEnv.who;
    }
  }
  // Default of CombatStatus, Support, Summon
  if (entityEnv.listenTo === "my" && typeof who !== "undefined") {
    return entityEnv.who === who;
  }
  return true;
}

/**
 * 创建只响应特定实体或角色（通常为被动技能）的入场事件
 * @param state 全局状态
 * @param sourceWho 所属玩家
 * @param entityOrCharacter 入场的实体或角色
 * @returns 要发送的 EventFactory，只会对特定实体有效
 */
function createEnterEventContext(
  state: GameState,
  sourceWho: 0 | 1,
  entityOrCharacter: Entity
): EventFactory {
  const sourceEnv = getEntityById(state, entityOrCharacter.entityId);
  if (sourceEnv === null) return () => [];
  return createCommonEventContext("onEnter")(
    state,
    sourceWho,
    sourceEnv.master,
    entityOrCharacter.entityId
  );
}

function createRollPhaseContext(
  state: GameState,
  sourceWho: 0 | 1,
  rollConfig: RollPhaseConfig
): EventFactory {
  return (entityId: number) => {
    const env = getEntityById(state, entityId);
    if (env === null) return [];
    if (!checkShouldListen(env, sourceWho)) return [];
    const ctx = new RollContextImpl(state.getPlayer(sourceWho), rollConfig);
    return [["onRollPhase", ctx]];
  };
}

function createDamageContext(
  eventName: EventHandlerNames,
  CtxImpl = DamageContextImpl
) {
  return (
    state: GameState,
    damage: Damage,
    sourceWho: 0 | 1,
    targetWho: 0 | 1,
    sourceCharacter?: Character | undefined
  ): EventFactory => {
    return (entityId: number) => {
      const env = getEntityById(state, entityId);
      if (env === null) return [];
      if (eventName === "onDamaged" || eventName === "onBeforeDamaged") {
        if (!checkShouldListen(env, targetWho, damage.target)) return [];
      } else {
        if (!checkShouldListen(env, sourceWho, sourceCharacter)) return [];
      }
      const ctx = new CtxImpl(state, env.who, entityId, damage);
      return [[eventName, ctx]];
    };
  };
}

function createReactionContext(
  state: GameState,
  sourceWho: 0 | 1,
  sourceId: number,
  reaction: Reaction
): EventFactory {
  return (entityId: number) => {
    const env = getEntityById(state, entityId);
    if (env === null) return [];
    if (!checkShouldListen(env, sourceWho)) return [];
    const ctx = new ElementalReactionContextImpl(
      state,
      sourceWho,
      sourceId,
      reaction
    );
    return [["onElementalReaction", ctx]];
  };
}

function createUseSkillContext(
  state: GameState,
  sourceWho: 0 | 1,
  skill: Skill
): EventFactory {
  return (entityId: number) => {
    const env = getEntityById(state, entityId);
    if (env === null) return [];
    if (!checkShouldListen(env, sourceWho)) return [];
    const ctx = new SkillContextImpl(state, sourceWho, entityId, skill);
    return [["onUseSkill", ctx]];
  };
}

function createSwitchActiveContext(
  state: GameState,
  sourceWho: 0 | 1,
  from: Character,
  to: Character
): EventFactory {
  return (entityId: number) => {
    const env = getEntityById(state, entityId);
    if (env === null) return [];
    if (
      !checkShouldListen(env, sourceWho, from) &&
      !checkShouldListen(env, sourceWho, to)
    ) {
      return [];
    }
    const ctx = new SwitchActiveContextImpl(
      state,
      sourceWho,
      entityId,
      from,
      to
    );
    return [["onSwitchActive", ctx]];
  };
}

function createPlayCardContext(
  state: GameState,
  sourceWho: 0 | 1,
  card: Card,
  targets: PlayCardTargetObj[]
): EventFactory {
  return (entityId: number) => {
    const env = getEntityById(state, entityId);
    if (env === null) return [];
    if (!checkShouldListen(env, sourceWho)) return [];
    const ctx = new PlayCardContextImpl(state, sourceWho, card, targets);
    return [["onPlayCard", ctx]];
  };
}

function createUseDiceContext(
  state: GameState,
  sourceWho: 0 | 1,
  action: ActionConfig
): EventFactory {
  return (entityId: number) => {
    const env = getEntityById(state, entityId);
    if (env === null) return [];
    if (!checkShouldListen(env, sourceWho)) return [];
    const ctx = new UseDiceContextImpl(state, sourceWho, entityId, action);
    return [["onBeforeUseDice", ctx]];
  };
}

function createRequestFastSwitchContext(
  state: GameState,
  sourceWho: 0 | 1,
  token: RequestFastToken
): EventFactory {
  return (entityId: number) => {
    const env = getEntityById(state, entityId)!;
    if (!checkShouldListen(env, sourceWho)) return [];
    if (token.resolved) return [];
    const ctx = new RequestFastSwitchContextImpl(
      state,
      sourceWho,
      entityId,
      token
    );
    return [["onRequestFastSwitchActive", ctx]];
  };
}

type Creator = (state: GameState, ...args: any[]) => EventFactory;

export const CONTEXT_CREATOR = {
  onBattleBegin: createCommonEventContext("onBattleBegin"),
  onRollPhase: createRollPhaseContext,
  onActionPhase: createCommonEventContext("onActionPhase"),
  onEndPhase: createCommonEventContext("onEndPhase"),

  onBeforeAction: createCommonEventContext("onBeforeAction"),
  onBeforeUseDice: createUseDiceContext,
  onRequestFastSwitchActive: createRequestFastSwitchContext,

  onUseSkill: createUseSkillContext,
  onSwitchActive: createSwitchActiveContext,
  onPlayCard: createPlayCardContext,
  onDeclareEnd: createCommonEventContext("onDeclareEnd"),
  onAction: createCommonEventContext("onAction"),

  onEarlyBeforeDealDamage: createDamageContext("onEarlyBeforeDealDamage"),
  onBeforeDealDamage: createDamageContext("onBeforeDealDamage"),
  onBeforeSkillDamage: createDamageContext(
    "onBeforeSkillDamage",
    SkillDamageContextImpl
  ),
  onBeforeDamaged: createDamageContext("onBeforeDamaged"),

  onDamaged: createDamageContext("onDamaged"),

  onElementalReaction: createReactionContext,

  onRevive: createCommonEventContext("onRevive"),
  onEnter: createEnterEventContext,
} satisfies Partial<Record<EventHandlerNames, Creator>>;

type ContextCreator = typeof CONTEXT_CREATOR;
export type EventHandlerNames1 = keyof ContextCreator;

export type EventCreatorArgs<K extends keyof ContextCreator> =
  ContextCreator[K] extends (state: GameState, ...args: infer A) => EventFactory
    ? A
    : never;

export type EventCreatorArgsForPlayer<K extends keyof ContextCreator> =
  ContextCreator[K] extends (
    state: GameState,
    sourceWho: 0 | 1,
    ...args: infer A
  ) => EventFactory
    ? A
    : never;

export type EventCreatorArgsForCharacter<K extends EventHandlerNames1> =
  EventCreatorArgsForPlayer<K> extends [ch?: infer F, ...rest: infer R]
    ? Character extends F
      ? R
      : never
    : never;
