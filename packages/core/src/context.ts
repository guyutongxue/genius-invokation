import {
  CardInfo,
  CardTag,
  CardTarget,
  CharacterContext,
  CharacterInfo,
  Context,
  SyncEventMap,
  AsyncEventMap,
  EventMap,
  DamageContext,
  RollContext,
  ElementalReactionContext,
  EquipmentInfo,
  EventNames,
  PlayCardContext,
  SkillContext,
  SkillInfo,
  SpecialBits,
  StatusContext,
  StatusInfo,
  SummonContext,
  SummonInfo,
  SwitchActiveContext,
  UseDiceContext,
  getSkill,
  ListenTarget,
  PlayCardFilter,
  makeReaction,
  REACTION_MAP,
  SkillDamageContext,
  RequestFastSwitchContext,
  EntityContext,
  EquipmentContext,
  SupportContext,
  NormalSkillInfo,
  CharacterTag,
} from "@gi-tcg/data";
import { flip } from "@gi-tcg/utils";
import {
  CharacterState,
  Store,
  getCharacterAtPath,
  getEntityAtPath,
} from "./store.js";
import { Aura, DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import { PlayerMutator, fullSupportArea } from "./player.js";
import { CharacterPath, characterElementType } from "./character.js";
import { Card } from "./card.js";
import {
  AllEntityInfo,
  AllEntityState,
  Entity,
  EntityPath,
  EquipmentState,
  getVisibleValue,
} from "./entity.js";
import { ActionConfig, PlayCardTargetObj } from "./action.js";
import { Skill, getSkillEx } from "./skill.js";
import { Damage } from "./damage.js";
import * as _ from "lodash-es";

type ContextOfEvent<E extends EventNames> = Context<{}, EventMap[E], true>;
type EventAndContext<E extends EventNames = EventNames> = [
  event: E,
  ctx: ContextOfEvent<E>
];
export type EventFactory = (entityId: number) => EventAndContext[];

function getCharactersFromSelector(
  store: Store,
  callerWho: 0 | 1,
  selector: string
): CharacterPath[] {
  // entityId
  if (selector.startsWith("#")) {
    const entityId = Number(selector.slice(1));
    if (Number.isNaN(entityId)) {
      throw new Error(`Invalid character selector: ${selector}`);
    }
    return [
      ...store.findCharacter(0, (ch) => ch.entityId === entityId),
      ...store.findCharacter(1, (ch) => ch.entityId === entityId),
    ].map(([ch, chPath]) => chPath);
  }

  // prefix
  let who: 0 | 1 | "all" = callerWho;
  if (selector.startsWith("!")) {
    who = flip(callerWho);
    selector = selector.slice(1);
  } else if (selector.startsWith("+")) {
    who = "all";
    selector = selector.slice(1);
  }

  // directives
  if (selector.startsWith(":")) {
    const execR = /:(energy|has|tag\*|recent|exclude|exclude\*)\((.*)\)/.exec(
      selector
    );
    if (!execR) {
      throw new Error(`Invalid character selector: ${selector}`);
    }
    const [, type, arg] = execR;
    switch (type) {
      case "energy": {
        if (arg === "notFull") {
          return store
            .findCharacter(
              who,
              (ch) => !ch.defeated && ch.energy < ch.info.maxEnergy
            )
            .map(([, chPath]) => chPath);
        } else {
          const number = Number(arg);
          if (Number.isNaN(number)) {
            throw new Error(
              `Invalid character selector: ${selector}; ${arg} is not a number`
            );
          }
          return store
            .findCharacter(who, (ch) => !ch.defeated && ch.energy === number)
            .map(([, chPath]) => chPath);
        }
      }
      case "has": {
        const id = Number(arg);
        if (Number.isNaN(id)) {
          throw new Error(
            `Invalid character selector: ${selector}; ${arg} is not a number`
          );
        }
        return store
          .findCharacter(
            who,
            (ch) =>
              !!ch.statuses.find((st) => !ch.defeated && st.info.id === id)
          )
          .map(([, chPath]) => chPath);
      }
      case "tag*":
        const tag = arg as CharacterTag;
        return store
          .findCharacter(who, (ch) => ch.info.tags.includes(tag))
          .map(([, chPath]) => chPath);
      case "recent": {
        const rel = getCharactersFromSelector(store, callerWho, arg);
        if (rel.length === 0) {
          throw new Error(`Relative character not found: ${arg}`);
        }
        const base = rel[0];
        const basePlayer = store.state.players[base.who];
        const baseLength = basePlayer.characters.length;
        const targetWho = flip(base.who);
        const targetLength = store.state.players[targetWho].characters.length;
        const baseRatio =
          basePlayer.characters.findIndex(
            (ch) => ch.entityId === base.entityId
          ) -
          (baseLength / 2 - 0.5);
        const value = (chPath: CharacterPath) => {
          const index = store.state.players[chPath.who].characters.findIndex(
            (ch) => ch.entityId === chPath.entityId
          );
          const ratio = index - (targetLength / 2 - 0.5);
          return Math.abs(ratio - baseRatio);
        };
        const sorted = _.sortBy(
          store.findCharacter(targetWho, (ch) => !ch.defeated),
          ([ch, chPath]) => value(chPath)
        );
        return [sorted[0][1]];
      }
      case "exclude": {
        const rel = getCharactersFromSelector(store, callerWho, arg);
        if (rel.length === 0) {
          throw new Error(`Relative character not found: ${arg}`);
        }
        const excluded = rel.map((ch) => ch.entityId);
        return store
          .findCharacter(
            who,
            (ch) => !ch.defeated && !excluded.includes(ch.entityId)
          )
          .map(([ch, chPath]) => chPath);
      }
      case "exclude*": {
        const rel = getCharactersFromSelector(store, callerWho, arg);
        if (rel.length === 0) {
          throw new Error(`Relative character not found: ${arg}`);
        }
        const excluded = rel.map((ch) => ch.entityId);
        return store
          .findCharacter(who, (ch) => !excluded.includes(ch.entityId))
          .map(([, chPath]) => chPath);
      }
      default:
        throw new Error(`Invalid character selector: ${selector}`);
    }
  }

  const activeIds = [
    store.state.players[0].active?.entityId,
    store.state.players[1].active?.entityId,
  ];

  function activeOffsetChar(who: 0 | 1, offset: number): CharacterPath {
    const player = store.state.players[who];
    const activeIndex = player.characters.findIndex(
      (ch) => ch.entityId === player.active?.entityId
    );
    const index =
      (activeIndex + offset + player.characters.length) %
      player.characters.length;
    return {
      who,
      entityId: player.characters[index].entityId,
      indexHint: index,
      info: player.characters[index].info,
    };
  }

  switch (selector) {
    case "|":
      return store
        .findCharacter(
          who,
          (ch) => !ch.defeated && activeIds.includes(ch.entityId)
        )
        .map(([, chPath]) => chPath);
    case "<": {
      const r: CharacterPath[] = [];
      if (who === "all" || who === 0) {
        r.push(activeOffsetChar(0, -1));
      }
      if (who === "all" || who === 1) {
        r.push(activeOffsetChar(1, -1));
      }
      return r;
    }
    case ">": {
      const r: CharacterPath[] = [];
      if (who === "all" || who === 0) {
        r.push(activeOffsetChar(0, 1));
      }
      if (who === "all" || who === 1) {
        r.push(activeOffsetChar(1, 1));
      }
      return r;
    }
    case "<>":
      return store
        .findCharacter(
          who,
          (ch) => !ch.defeated && !activeIds.includes(ch.entityId)
        )
        .map(([, chPath]) => chPath);
    case "*":
      return store
        .findCharacter(who, (ch) => !ch.defeated)
        .map(([, chPath]) => chPath);
    case "**":
      return store.findCharacter(who, () => true).map(([, chPath]) => chPath);
    default:
      throw new Error(`Invalid character selector: ${selector}`);
  }
}

export class ContextImpl implements Context<any, {}, true> {
  constructor(protected store: Store, protected caller: EntityPath) {}

  private get who() {
    return this.caller.who;
  }
  private get player() {
    return this.store.state.players[this.who];
  }

  get currentPhase(): "action" | "end" | "other" {
    const phase = this.store.state.phase;
    if (phase === "action" || phase === "end") {
      return phase;
    } else {
      return "other";
    }
  }
  get currentTurn(): number {
    return this.store.state.currentTurn;
  }
  isMyTurn(): boolean {
    return this.currentTurn === this.caller.who;
  }
  checkSpecialBit(bit: SpecialBits): boolean {
    switch (bit) {
      case SpecialBits.DeclaredEnd:
        return this.player.declaredEnd;
      case SpecialBits.Defeated:
        return this.player.hasDefeated;
      case SpecialBits.LegendUsed:
        return this.player.legendUsed;
      case SpecialBits.Plunging:
        return this.player.canPlunging;
      case SpecialBits.SkipTurn:
        return this.player.skipNextTurn;
    }
  }

  protected createCharacterContext(ch: CharacterPath): CharacterContextImpl {
    return new CharacterContextImpl(this.store, ch, this.caller);
  }
  protected createEntityContext(path: EntityPath): EntityContextImpl {
    return new EntityContextImpl(this.store, path, this.caller);
  }

  queryCharacter(selector: string): CharacterContext<true> | null {
    const ctx = this.queryCharacterAll(selector);
    return ctx.length > 0 ? ctx[0] : null;
  }
  queryCharacterAll(selector: string): CharacterContext<true>[] {
    return getCharactersFromSelector(this.store, this.who, selector).map((c) =>
      this.createCharacterContext(c)
    );
  }
  fullSupportArea(opp: boolean): boolean {
    const who = opp ? flip(this.who) : this.who;
    return fullSupportArea(this.store.state, who);
  }
  findSummon(summon: number): SummonContext<true> | null {
    const r = this.store.findEntity(
      this.who,
      "summon",
      (s) => s.info.id === summon
    );
    return r.length > 0 ? this.createEntityContext(r[0][1]) : null;
  }
  allSummons(includeOpp = false): SummonContext<true>[] {
    const mySummons = this.store.findEntity(this.who, "summon", () => true);
    const oppSummons = includeOpp
      ? this.store.findEntity(flip(this.who), "summon", () => true)
      : [];
    return [...mySummons, ...oppSummons].map(([st, path]) =>
      this.createEntityContext(path)
    );
  }

  findCombatStatus(status: number): StatusContext<true> | null {
    const r = this.store.findEntity(
      this.who,
      "status",
      (st) => st.info.id === status
    );
    return r.length > 0 ? this.createEntityContext(r[0][1]) : null;
  }
  findCombatShield(): StatusContext<true> | null {
    const r = this.store.findEntity(
      this.who,
      "status",
      (st) => st.info.shield !== null
    );
    return r.length > 0 ? this.createEntityContext(r[0][1]) : null;
  }

  dealDamage(value: number, type: DamageType, target?: string): void {
    const chs = getCharactersFromSelector(this.store, this.who, target ?? "!|");
    for (const ch of chs) {
      this.store.dealDamage(this.sourceId, ch.character, value, type);
    }
  }
  applyElement(type: DamageType, target?: string): void {
    // TODO
    throw new Error("Shouldn't called by base class");
  }
  gainEnergy(value?: number | undefined, target?: string): number {
    const ctx = this.queryCharacterAll(target ?? "|");
    let sum = 0;
    for (const ch of ctx) {
      sum += ch.gainEnergy(value ?? 0);
    }
    return sum;
  }
  loseEnergy(value?: number | undefined, target?: string): number {
    const ctx = this.queryCharacterAll(target ?? "|");
    let sum = 0;
    for (const ch of ctx) {
      sum += ch.loseEnergy(value ?? 0);
    }
    return sum;
  }

  createCombatStatus(
    status: number,
    opp: boolean = false
  ): StatusContext<true> {
    const player = this.store.mutator.players[opp ? flip(this.who) : this.who];
    const st = player.createCombatStatus(status);
    // this.store.pushEvent(createEnterEventContext(this.store, this.who, st));
    return new EntityContextImpl(this.store, st, this.caller);
  }
  summon(summon: number): SummonContext<true> {
    const path = this.store.mutator.players[this.who].createSummon(summon);
    // this.store.pushEvent(
    //   createEnterEventContext(this.store, this.who, summonObj)
    // );
    return this.createEntityContext(path);
  }
  summonOneOf(...summons: number[]): void {
    const summon = summons[Math.floor(Math.random() * summons.length)];
    this.summon(summon);
  }
  createSupport(
    support: number,
    opp?: boolean | undefined
  ): SupportContext<true> {
    const path =
      this.store.mutator.players[opp ? flip(this.who) : this.who].createSupport(
        support
      );
    // this.store.pushEvent(
    //   createEnterEventContext(this.store, this.who, supportObj)
    // );
    return this.createEntityContext(path);
  }

  get dice(): readonly DiceType[] {
    return this.player.dice;
  }
  absorbDice(indexes: number[]): DiceType[] {
    return this.store.mutator.players[this.who].absorbDice(indexes);
  }
  rollDice(count: number): Promise<void> {
    return this.store.mutator.players[this.who].rerollDice(count);
  }
  generateDice(...dice: DiceType[]): void {
    this.store.mutator.players[this.who].generateDice(...dice);
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

  getCardCount(opp?: boolean | undefined): number {
    return this.store.state.players[opp ? flip(this.who) : this.who].hands
      .length;
  }
  drawCards(
    count: number,
    opp?: boolean | undefined,
    tag?: CardTag | undefined
  ): void {
    const player = this.store.mutator.players[opp ? flip(this.who) : this.who];
    const controlled = tag ? player.cardsWithTagFromPile(tag) : [];
    player.drawHands(count, controlled);
  }
  createCards(...ids: number[]): void {
    this.store.mutator.players[this.who].createHands(...ids);
  }
  switchCards(): Promise<void> {
    return this.store.mutator.players[this.who].switchHands();
  }

  switchActive(target: string): void {
    const chPaths = getCharactersFromSelector(this.store, this.who, target);
    if (chPaths.length === 0) {
      throw new Error(`Switching active: Target not exists: ${target}`);
    }
    const chPath = chPaths[0];
    const player = this.store.mutator.players[chPath.who];
    player.switchActive(chPath.entityId);
  }
  useSkill(skill: number | "normal"): Promise<void> {
    const sk = getSkillEx(this.store.state, this.who, skill);
    const player = this.store.mutator.players[this.who];
    return player.useSkill(sk, this.caller);
  }

  actionAgain(): void {
    this.store.produce((draft) => {
      draft.players[flip(this.who)].skipNextTurn = true;
    });
  }
}

class CharacterContextImpl implements CharacterContext<true> {
  constructor(
    private store: Store,
    public readonly path: CharacterPath,
    public readonly caller: EntityPath
  ) {}

  private get character() {
    return getCharacterAtPath(this.store.state, this.path);
  }

  get entityId() {
    return this.path.entityId;
  }
  get info(): CharacterInfo {
    return this.path.info;
  }
  get health() {
    return this.character.health;
  }
  get energy() {
    return this.character.energy;
  }
  get aura() {
    return this.character.aura;
  }
  isAlive() {
    return !this.character.defeated;
  }

  indexOfPlayer() {
    return this.store.state.players[this.path.who].characters.findIndex(
      (c) => c.entityId === this.entityId
    );
  }

  findEquipment(
    equipment: number | "artifact" | "weapon"
  ): EquipmentContext<true> | null {
    let eq: EquipmentState | undefined;
    const eqs = this.store.findEntity(this.path, "equipment", (e) => {
      if (typeof equipment === "number") {
        return e.info.id === equipment;
      } else {
        return e.info.type === equipment;
      }
    });
    return eqs.length > 0 ? new EntityContextImpl(this.store, eqs[0][1], this.caller) : null;
  }
  equip(equipment: number): void {
    const eqId = typeof equipment === "number" ? equipment : equipment.id;
    const eq = new Equipment(eqId);
    this.character.equipments.push(eq);
    this.store.pushEvent(createEnterEventContext(this.store, this.who, eq));
  }
  removeEquipment(equipment: number | EquipmentInfo): void {
    const eqId = typeof equipment === "number" ? equipment : equipment.id;
    this.character.equipments = this.character.equipments.filter(
      (e) => e.info.id !== eqId
    );
  }

  heal(amount: number): void {
    if (this.character.health === 0) {
      this.character.revive();
    }
    this.store.heal(this.character, amount, this.sourceId);
  }
  gainEnergy(amount: number): number {
    return this.character.gainEnergy(amount);
  }
  loseEnergy(amount: number): number {
    const oldEnergy = this.character.energy;
    this.character.energy = Math.max(this.character.energy - amount, 0);
    return oldEnergy - this.character.energy;
  }
  createStatus(status: number): StatusContext<true> {
    const st = this.character.createStatus(status);
    this.store.pushEvent(createEnterEventContext(this.store, this.who, st));
    return new EntityContextImpl(st);
  }
  removeStatus(status: number): boolean {
    const st = this.character.statuses.findIndex((s) => s.info.id === status);
    if (st === -1) return false;
    this.character.statuses.splice(st, 1);
    return true;
  }
  findStatus(status: number): StatusContext<true> | null {
    const st = this.character.statuses.find((s) => s.info.id === status);
    if (!st) return null;
    return new EntityContextImpl(this.store, st, this.caller);
  }
  findShield(): StatusContext<true> {
    const st = this.character.statuses.find((s) => s.shield !== null);
    if (!st) throw new Error("No shield");
    return new EntityContextImpl(st);
  }

  isActive() {
    return (
      this.store.getPlayer(this.who).getCharacter("active").entityId ===
        this.entityId ||
      this.store.getPlayer(flip(this.who)).getCharacter("active").entityId ===
        this.entityId
    );
  }
  isMine() {
    return this.path.who === this.caller.who;
  }
  asTarget(): `#${number}` {
    return `#${this.path.entityId}`;
  }
  elementType(): DiceType {
    return characterElementType(this.character);
  }
}

export class EntityContextImpl
  implements EntityContext<AllEntityInfo, number, "yes", true>
{
  constructor(
    private store: Store,
    private path: EntityPath,
    private caller: EntityPath
  ) {}

  private get entity(): AllEntityState {
    return getEntityAtPath(this.store.state, this.path);
  }

  get entityId() {
    return this.entity.entityId;
  }

  get info(): any {
    return this.entity.info;
  }
  get id(): any {
    return this.info.id;
  }

  isMine() {
    return this.path.who === this.caller.who;
  }

  get usage() {
    return this.entity.state;
  }

  setUsage(value: number) {
    // TODO
    return this.usage;
  }

  get value(): number {
    const v = getVisibleValue(this.entity);
    if (v === null) {
      throw new Error("Value not exists");
    }
    return v;
  }
  setValue(value: number): number {
    const f = getVisibleValue(this.entity, value);
    this.store.updateEntityAtPath(this.path, f);
    return this.value;
  }

  get master(): any {
    if (!("character" in this.path)) {
      return null;
    }
    return new CharacterContextImpl(
      this.store,
      this.path.character,
      this.caller
    );
  }
  dispose(): void {
    const env = getEntityById(this.store, this.sourceId);
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
    protected skill: NormalSkillInfo
  ) {
    super(state, who, sourceId);
  }

  get character() {
    const player = this.store.state.players[this.who];
    const ch = player.characters.find((ch) =>
      ch.info.skills.includes(this.skill.info.id)
    );
    if (!ch) throw new Error("Character not found");
    return this.createCharacterContext(ch);
  }
  get target() {
    const player = this.store.getPlayer(flip(this.who));
    const ch = player.getCharacter("active");
    return this.createCharacterContext(ch);
  }

  triggeredByCard(card: number): PlayCardContext | null {
    const ctx = getContextById(this.store, this.sourceId);
    if (ctx instanceof PlayCardContextImpl) {
      if (ctx.card.info.id === card) {
        return ctx;
      }
    }
    return null;
  }
  triggeredByStatus(status: number): StatusContext | null {
    const ctx = getContextById(this.store, this.sourceId);
    if (ctx instanceof StatusContextImpl) {
      if (ctx.info.id === status) {
        return ctx;
      }
    }
    return null;
  }

  isCharged(): boolean {
    const player = this.store.getPlayer(this.who);
    const bit = player.dice.length % 2 === 0;
    return bit && this.skill.info.type === "normal";
  }
  isPlunging(): boolean {
    const player = this.store.getPlayer(this.who);
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
    return this.store.damageLog.map(
      ([dmg]) => new DamageContextImpl(this.store, this.who, 0, dmg)
    );
  }
  getAllDescendingReactions(): ElementalReactionContext[] {
    return this.store.reactionLog.map(
      ([_, id, reaction]) =>
        new ElementalReactionContextImpl(this.store, this.who, id, reaction)
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
        this.targetCtxs.push(this.createEntityContext(obj));
      } else {
        console.error(obj);
        throw new Error(`Unknown target object: ${obj}`);
      }
    }
  }
  get info(): CardInfo {
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
  constructor(private player: PlayerMutator, private config: RollPhaseConfig) {}

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
    return getContextById(this.store, srcId);
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
    const { who } = getEntityById(this.store, sourceId)!;
    return new ElementalReactionContextImpl(
      this.store,
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
      this.store,
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
  get skillInfo(): SkillInfo {
    return this.getSkillCtx().info;
  }
  get characterInfo(): CharacterInfo {
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

function createCommonEventContext(...events: EventNames[]) {
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
  eventName: EventNames,
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
  onDealDamage: createDamageContext("onDealDamage"),
  onElementalReaction: createReactionContext,

  // onBeforeDefeated,
  // onDefeated,

  onRevive: createCommonEventContext("onRevive"),
  onEnter: createEnterEventContext,
} satisfies Partial<Record<EventNames, Creator>>;

type ContextCreator = typeof CONTEXT_CREATOR;
export type EventHandlerNames1 = keyof ContextCreator;

// export type EventCreatorArgs<K extends keyof ContextCreator> =
//   ContextCreator[K] extends (state: GameState, ...args: infer A) => EventFactory
//     ? A
//     : never;

// export type EventCreatorArgsForPlayer<K extends keyof ContextCreator> =
//   ContextCreator[K] extends (
//     state: GameState,
//     sourceWho: 0 | 1,
//     ...args: infer A
//   ) => EventFactory
//     ? A
//     : never;

// export type EventCreatorArgsForCharacter<K extends EventHandlerNames1> =
//   EventCreatorArgsForPlayer<K> extends [ch?: infer F, ...rest: infer R]
//     ? Character extends F
//       ? R
//       : never
//     : never;
