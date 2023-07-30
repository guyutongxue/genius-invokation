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
import {
  CharacterPath,
  characterElementType,
  createEquipment,
  createStatus,
  gainEnergy,
  loseEnergy,
  revive,
} from "./character.js";
import { Card } from "./card.js";
import {
  AllEntityInfo,
  AllEntityState,
  CardPath,
  Entity,
  EntityPath,
  EquipmentState,
  SkillPath,
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
  readonly this: any;
  constructor(protected store: Store, protected caller: EntityPath) {
    if (caller.type === "skill" || caller.type === "card") {
      this.this = {}; // never
    } else {
      this.this = new Proxy(
        new EntityContextImpl(store, caller, caller),
        CONTEXT_THIS_PROXY_HANDLER
      );
    }
  }

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
    return new CharacterContextImpl(this.store, this.caller, ch);
  }
  protected createEntityContext(path: EntityPath): EntityContextImpl {
    return new EntityContextImpl(this.store, this.caller, path);
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
      this.store.mutator.dealDamage(this.caller, ch, value, type);
    }
  }
  applyElement(type: DamageType, target?: string): void {
    const chs = getCharactersFromSelector(this.store, this.who, target ?? "|");
    for (const ch of chs) {
      this.store.mutator.applyElement(this.caller, ch, type);
    }
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
    return new EntityContextImpl(this.store, this.caller, st);
  }
  summon(summon: number): SummonContext<true> {
    const path = this.store.mutator.players[this.who].createSummon(summon);
    // this.store.pushEvent(
    //   createEnterEventContext(this.store, this.who, summonObj)
    // );
    return this.createEntityContext(path);
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
      // TODO: use seed
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

  skillCount(skill: number): number {
    return this.player.skillLog.filter((sk) => sk === skill).length;
  }
  cardCount(card: number): number {
    return this.player.cardLog.filter((c) => c === card).length;
  }

  randomOne<T>(...items: T[]): T {
    // TODO: use seed
    return items[Math.floor(Math.random() * items.length)];
  }
}

const CONTEXT_THIS_PROXY_HANDLER: ProxyHandler<EntityContextImpl> = {
  get(target, prop, receiver) {
    const state = target.getState();
    if (prop in state) {
      return state[prop];
    } else {
      return Reflect.get(target, prop, receiver);
    }
  },
  set(target, p, newValue, receiver) {
    const state = target.getState();
    if (p in state) {
      state[p] = newValue;
      return true;
    } else {
      return Reflect.set(target, p, newValue, receiver);
    }
  },
};

class CharacterContextImpl implements CharacterContext<true> {
  constructor(
    private store: Store,
    public readonly caller: EntityPath,
    public readonly path: CharacterPath
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
    return eqs.length > 0
      ? new EntityContextImpl(this.store, this.caller, eqs[0][1])
      : null;
  }
  equip(equipment: number): void {
    let eq: EntityPath;
    this.store.updateCharacterAtPath(this.path, (ch, chPath) => {
      eq = createEquipment(ch, chPath, equipment);
    });
    // this.store.pushEvent(createEnterEventContext(this.store, this.who, eq));
  }
  removeEquipment(equipment: number): boolean {
    let result = false;
    this.store.updateCharacterAtPath(this.path, (ch) => {
      const idx = ch.equipments.findIndex((st) => st.info.id === equipment);
      if (idx !== -1) {
        ch.statuses.splice(idx, 1);
        result = true;
      }
    });
    return result;
  }

  heal(amount: number): void {
    if (this.character.health === 0) {
      this.store.updateCharacterAtPath(this.path, revive);
    }
    this.store.mutator.heal(this.caller, this.path, amount);
  }
  gainEnergy(amount: number): number {
    const oldEnergy = this.character.energy;
    this.store.updateCharacterAtPath(this.path, (ch) => gainEnergy(ch, amount));
    return this.character.energy - oldEnergy;
  }
  loseEnergy(amount: number): number {
    const oldEnergy = this.character.energy;
    this.store.updateCharacterAtPath(this.path, (ch) => loseEnergy(ch, amount));
    return oldEnergy - this.character.energy;
  }
  createStatus(status: number): StatusContext<true> {
    let st: EntityPath = null!;
    this.store.updateCharacterAtPath(this.path, (ch, chPath) => {
      st = createStatus(ch, chPath, status);
    });
    // this.store.pushEvent(createEnterEventContext(this.store, this.who, st));
    return new EntityContextImpl(this.store, this.caller, st);
  }
  removeStatus(status: number): boolean {
    let result = false;
    this.store.updateCharacterAtPath(this.path, (ch) => {
      const idx = ch.statuses.findIndex((st) => st.info.id === status);
      if (idx !== -1) {
        ch.statuses.splice(idx, 1);
        result = true;
      }
    });
    return result;
  }
  findStatus(status: number): StatusContext<true> | null {
    const results = this.store.findEntity(
      this.path,
      "status",
      (s) => s.info.id === status
    );
    return results.length > 0
      ? new EntityContextImpl(this.store, this.caller, results[0][1])
      : null;
  }
  findShield(): StatusContext<true> {
    const results = this.store.findEntity(
      this.path,
      "status",
      (s) => s.info.shield !== null
    );
    if (results.length === 0) throw new Error("No shield");
    return new EntityContextImpl(this.store, this.caller, results[0][1]);
  }

  isActive() {
    return (
      this.store.state.players[this.path.who].active?.entityId ===
      this.path.entityId
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
    private caller: EntityPath,
    private path: EntityPath
  ) {}

  private get entity(): AllEntityState {
    return getEntityAtPath(this.store.state, this.path);
  }

  getState() {
    return this.entity.state;
  }
  setState(prop: string, newValue: any) {
    this.store.updateEntityAtPath(this.path, (e) => {
      e.state[prop] = newValue;
    });
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
    this.store.updateEntityAtPath(this.path, (e) => {
      e.usage = value;
    });
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
      this.caller,
      this.path.character
    );
  }
  dispose(): void {
    this.store.updateEntityAtPath(this.path, (s) => {
      s.shouldDispose = true;
    });
  }
}

class SwitchActiveContextImpl implements SwitchActiveContext<true> {
  from: CharacterContext<true>;
  to: CharacterContext<true>;
  constructor(
    store: Store,
    caller: EntityPath,
    from: CharacterPath,
    to: CharacterPath
  ) {
    // super(store, caller);
    this.from = new CharacterContextImpl(store, caller, from);
    this.to = new CharacterContextImpl(store, caller, to);
  }
}

export class UseDiceContextImpl
  extends ContextImpl
  implements Context<any, UseDiceContext, true>
{
  switchActiveCtx?: SwitchActiveContext;
  useSkillCtx?: SkillContext;
  playCardCtx?: PlayCardContext;

  constructor(store: Store, caller: EntityPath, private action: ActionConfig) {
    super(store, caller);
    switch (action.type) {
      case "switchActive": {
        this.switchActiveCtx = new SwitchActiveContextImpl(
          store,
          caller,
          action.from,
          action.to
        );
        break;
      }
      case "useSkill": {
        this.useSkillCtx = new SkillContextImpl(store, caller, action.skill);
        break;
      }
      case "playCard": {
        this.playCardCtx = new PlayCardContextImpl(
          store,
          this.caller,
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

export class SkillContextImpl implements SkillContext<true> {
  constructor(
    private store: Store,
    private caller: EntityPath,
    private skill: SkillPath
  ) {
    // super(state, caller);
  }

  get id(): any {
    return this.skill.info.id;
  }

  get character() {
    return new CharacterContextImpl(
      this.store,
      this.caller,
      this.skill.character
    );
  }
  get target() {
    const targetPath = this.store.state.players[flip(this.caller.who)].active;
    if (targetPath === null) {
      throw new Error(`Opponent has no active character`);
    }
    return new CharacterContextImpl(this.store, this.caller, targetPath);
  }

  get info() {
    return this.skill.info;
  }

  triggeredByCard(card: number): PlayCardContext | null {
    if (this.caller.type === "card" && this.caller.info.id === card) {
      return new PlayCardContextImpl(this.store, this.caller, this.caller, [
        this.skill.character,
      ]);
    }
    return null;
  }
  triggeredByStatus(status: number): StatusContext<true> | null {
    if (this.caller.type === "status" && this.caller.info.id === status) {
      return new EntityContextImpl(this.store, this.caller, this.caller);
    }
    return null;
  }

  get charged(): boolean {
    const bit =
      this.store.state.players[this.skill.character.who].dice.length % 2 === 0;
    return bit && this.skill.info.type === "normal";
  }
  get plunging(): boolean {
    const bit = this.store.state.players[this.skill.character.who].canPlunging;
    return bit && this.skill.info.type === "normal";
  }

  get damages(): DamageContext[] {
    // TODO
    return [];
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

export class PlayCardContextImpl implements PlayCardContext {
  targetCtxs: CardTarget[keyof CardTarget][] = [];

  constructor(
    private store: Store,
    private caller: EntityPath,
    public readonly card: CardPath,
    private readonly targetObj: PlayCardTargetObj[]
  ) {
    // super(store, caller);
    for (const obj of this.targetObj) {
      if ("type" in obj) {
        this.targetCtxs.push(new EntityContextImpl(store, caller, obj));
      } else {
        this.targetCtxs.push(new CharacterContextImpl(store, caller, obj));
      }
    }
  }

  get id(): any {
    return this.card.info.id;
  }

  get info(): CardInfo {
    return this.card.info;
  }

  get target(): any {
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
      !!this.targetObj.find((ch) => ch.info.id === charId)
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

  fixDice(...dice: DiceType[]): void {
    this.config.controlled.push(...dice);
  }

  addRerollCount(count: number): void {
    this.config.times += count;
  }
}

class ElementalReactionContextImpl implements ElementalReactionContext {
  constructor(store: Store, caller: EntityPath, private reaction: Reaction) {
    // super(store, caller);
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

export class DamageContextImpl implements DamageContext {
  constructor(
    private store: Store,
    private caller: EntityPath,
    private damage: Damage
  ) {
    // super(store, caller);
  }

  get sourceSummon() {
    if (this.damage.source.type === "summon") {
      return new EntityContextImpl(this.store, this.caller, this.damage.source);
    } else {
      return undefined;
    }
  }

  get sourceSkill() {
    if (this.damage.source.type === "skill") {
      return new SkillContextImpl(this.store, this.caller, this.damage.source);
    } else {
      return undefined;
    }
  }

  get sourceReaction() {
    const reaction = this.damage.triggeredByReaction;
    if (typeof reaction === "undefined") {
      return undefined;
    }
    return new ElementalReactionContextImpl(this.store, this.caller, reaction);
  }

  get target() {
    return new CharacterContextImpl(
      this.store,
      this.caller,
      this.damage.target
    );
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
    const target = getCharacterAtPath(this.store.state, this.damage.target);
    const reaction = makeReaction(target.aura, type)[1];
    if (reaction === null) {
      return null;
    }
    return new ElementalReactionContextImpl(this.store, this.caller, reaction);
  }

  changeDamageType(type: DamageType) {
    this.damage.changedLogs.push([this.caller, type]);
  }
  addDamage(value: number): void {
    this.damage.addedLogs.push([this.caller, value]);
  }
  multiplyDamage(value: number): void {
    this.damage.multipliedLogs.push([this.caller, value]);
  }
  decreaseDamage(value: number): void {
    this.damage.decreasedLogs.push([this.caller, value]);
  }
}

class SkillDamageContextImpl
  extends DamageContextImpl
  implements SkillDamageContext
{
  get sourceSkill() {
    return super.sourceSkill!;
  }
}

export interface RequestFastToken {
  resolved: boolean;
}

class RequestFastSwitchContextImpl implements RequestFastSwitchContext {
  constructor(
    private store: Store,
    private caller: EntityPath,
    private token: RequestFastToken
  ) {
    // super(store, caller);
  }

  requestFast(condition?: boolean | undefined): void {
    if (this.token.resolved) {
      throw new Error("Token already resolved");
    }
    if (typeof condition === "undefined" || condition === true) {
      this.token.resolved = true;
    }
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
