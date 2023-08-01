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
  EventNames,
  PlayCardContext,
  SkillContext,
  SpecialBits,
  StatusContext,
  SummonContext,
  SwitchActiveContext,
  UseDiceContext,
  makeReaction,
  REACTION_MAP,
  SkillDamageContext,
  RequestFastSwitchContext,
  EntityContext,
  EquipmentContext,
  SupportContext,
  NormalSkillInfo,
  CharacterTag,
  BeforeDefeatedContext,
} from "@gi-tcg/data";
import { flip } from "@gi-tcg/utils";
import {
  CharacterState,
  GameState,
  Store,
  findCharacter,
  findEntity,
  getCharacterAtPath,
  getEntityAtPath,
} from "./store.js";
import { Aura, DamageType, DiceType, Reaction } from "@gi-tcg/typings";
import { fullSupportArea } from "./player.js";
import {
  CharacterPath,
  characterElementType,
  createEquipment,
  createStatus,
  gainEnergy,
  loseEnergy,
} from "./character.js";
import {
  AllEntityInfo,
  AllEntityState,
  CardPath,
  EntityPath,
  EquipmentState,
  SkillPath,
  getVisibleValue,
} from "./entity.js";
import { ActionConfig, PlayCardTargetPath } from "./action.js";
import { getSkillEx } from "./skill.js";
import { Damage } from "./damage.js";
import * as _ from "lodash-es";

type ContextOfEvent<E extends EventNames> = Context<object, EventMap[E], true>;
type ContextFactory<Ctx = Context<object, unknown, true>> = (
  store: Store,
  caller: EntityPath,
) => Ctx | null;
export type EventDescriptor<E extends EventNames> = [
  event: E,
  ctxFactory: ContextFactory<ContextOfEvent<E>>,
];
export type AsyncEventDescriptor = EventDescriptor<keyof AsyncEventMap>;
export type AnyEventDescriptor = [
  event: EventNames,
  ctxFactory: ContextFactory,
];

function getCharactersFromSelector(
  state: GameState,
  callerWho: 0 | 1,
  selector: string,
): CharacterPath[] {
  // entityId
  if (selector.startsWith("#")) {
    const entityId = Number(selector.slice(1));
    if (Number.isNaN(entityId)) {
      throw new Error(`Invalid character selector: ${selector}`);
    }
    return [
      ...findCharacter(state, 0, (ch) => ch.entityId === entityId),
      ...findCharacter(state, 1, (ch) => ch.entityId === entityId),
    ].map(([, chPath]) => chPath);
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
      selector,
    );
    if (!execR) {
      throw new Error(`Invalid character selector: ${selector}`);
    }
    const [, type, arg] = execR;
    switch (type) {
      case "energy": {
        if (arg === "notFull") {
          return findCharacter(
            state,
            who,
            (ch) => !ch.defeated && ch.energy < ch.info.maxEnergy,
          ).map(([, chPath]) => chPath);
        } else {
          const number = Number(arg);
          if (Number.isNaN(number)) {
            throw new Error(
              `Invalid character selector: ${selector}; ${arg} is not a number`,
            );
          }
          return findCharacter(
            state,
            who,
            (ch) => !ch.defeated && ch.energy === number,
          ).map(([, chPath]) => chPath);
        }
      }
      case "has": {
        const id = Number(arg);
        if (Number.isNaN(id)) {
          throw new Error(
            `Invalid character selector: ${selector}; ${arg} is not a number`,
          );
        }
        return findCharacter(
          state,
          who,
          (ch) => !!ch.statuses.find((st) => !ch.defeated && st.info.id === id),
        ).map(([, chPath]) => chPath);
      }
      case "tag*":
        const tag = arg as CharacterTag;
        return findCharacter(state, who, (ch) =>
          ch.info.tags.includes(tag),
        ).map(([, chPath]) => chPath);
      case "recent": {
        const rel = getCharactersFromSelector(state, callerWho, arg);
        if (rel.length === 0) {
          throw new Error(`Relative character not found: ${arg}`);
        }
        const base = rel[0];
        const basePlayer = state.players[base.who];
        const baseLength = basePlayer.characters.length;
        const targetWho = flip(base.who);
        const targetLength = state.players[targetWho].characters.length;
        const baseRatio =
          basePlayer.characters.findIndex(
            (ch) => ch.entityId === base.entityId,
          ) -
          (baseLength / 2 - 0.5);
        const value = (chPath: CharacterPath) => {
          const index = state.players[chPath.who].characters.findIndex(
            (ch) => ch.entityId === chPath.entityId,
          );
          const ratio = index - (targetLength / 2 - 0.5);
          return Math.abs(ratio - baseRatio);
        };
        const sorted = _.sortBy(
          findCharacter(state, targetWho, (ch) => !ch.defeated),
          ([, chPath]) => value(chPath),
        );
        return [sorted[0][1]];
      }
      case "exclude": {
        const rel = getCharactersFromSelector(state, callerWho, arg);
        if (rel.length === 0) {
          throw new Error(`Relative character not found: ${arg}`);
        }
        const excluded = rel.map((ch) => ch.entityId);
        return findCharacter(
          state,
          who,
          (ch) => !ch.defeated && !excluded.includes(ch.entityId),
        ).map(([, chPath]) => chPath);
      }
      case "exclude*": {
        const rel = getCharactersFromSelector(state, callerWho, arg);
        if (rel.length === 0) {
          throw new Error(`Relative character not found: ${arg}`);
        }
        const excluded = rel.map((ch) => ch.entityId);
        return findCharacter(
          state,
          who,
          (ch) => !excluded.includes(ch.entityId),
        ).map(([, chPath]) => chPath);
      }
      default:
        throw new Error(`Invalid character selector: ${selector}`);
    }
  }

  const activeIds = [
    state.players[0].active?.entityId,
    state.players[1].active?.entityId,
  ];

  function activeOffsetChar(who: 0 | 1, offset: number): CharacterPath {
    const player = state.players[who];
    const activeIndex = player.characters.findIndex(
      (ch) => ch.entityId === player.active?.entityId,
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
      return findCharacter(
        state,
        who,
        (ch) => !ch.defeated && activeIds.includes(ch.entityId),
      ).map(([, chPath]) => chPath);
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
      return findCharacter(
        state,
        who,
        (ch) => !ch.defeated && !activeIds.includes(ch.entityId),
      ).map(([, chPath]) => chPath);
    case "*":
      return findCharacter(state, who, (ch) => !ch.defeated).map(
        ([, chPath]) => chPath,
      );
    case "**":
      return findCharacter(state, who).map(([, chPath]) => chPath);
    default:
      throw new Error(`Invalid character selector: ${selector}`);
  }
}

export class ContextImpl implements Context<object, object, true> {
  readonly this: object;
  constructor(
    private store: Store,
    private caller: EntityPath,
  ) {
    if (caller.type === "skill" || caller.type === "card") {
      this.this = {}; // never
    } else {
      this.this = new Proxy(
        new EntityContextImpl(store, caller, caller),
        CONTEXT_THIS_PROXY_HANDLER,
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
    return getCharactersFromSelector(this.store.state, this.who, selector).map(
      (c) => this.createCharacterContext(c),
    );
  }
  fullSupportArea(opp: boolean): boolean {
    const who = opp ? flip(this.who) : this.who;
    return fullSupportArea(this.store.state, who);
  }
  findSummon(summon: number): SummonContext<true> | null {
    const r = findEntity(
      this.store.state,
      this.who,
      "summon",
      (s) => s.info.id === summon,
    );
    return r.length > 0 ? this.createEntityContext(r[0][1]) : null;
  }
  allSummons(includeOpp = false): SummonContext<true>[] {
    const mySummons = findEntity(this.store.state, this.who, "summon");
    const oppSummons = includeOpp
      ? findEntity(this.store.state, flip(this.who), "summon")
      : [];
    return [...mySummons, ...oppSummons].map(([, path]) =>
      this.createEntityContext(path),
    );
  }

  findCombatStatus(status: number): StatusContext<true> | null {
    const r = findEntity(
      this.store.state,
      this.who,
      "status",
      (st) => st.info.id === status,
    );
    return r.length > 0 ? this.createEntityContext(r[0][1]) : null;
  }
  findCombatShield(): StatusContext<true> | null {
    const r = findEntity(
      this.store.state,
      this.who,
      "status",
      (st) => st.info.shield !== null,
    );
    return r.length > 0 ? this.createEntityContext(r[0][1]) : null;
  }

  dealDamage(value: number, type: DamageType, target?: string): void {
    const chs = getCharactersFromSelector(
      this.store.state,
      this.who,
      target ?? "!|",
    );
    for (const ch of chs) {
      this.store.mutator.dealDamage(this.caller, ch, value, type);
    }
  }
  applyElement(type: DamageType, target?: string): void {
    const chs = getCharactersFromSelector(
      this.store.state,
      this.who,
      target ?? "|",
    );
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
    opp: boolean = false,
  ): StatusContext<true> {
    const player = this.store.mutator.players[opp ? flip(this.who) : this.who];
    const st = player.createCombatStatus(status);
    return new EntityContextImpl(this.store, this.caller, st);
  }
  summon(summon: number): SummonContext<true> {
    const path = this.store.mutator.players[this.who].createSummon(summon);
    return this.createEntityContext(path);
  }
  createSupport(
    support: number,
    opp?: boolean | undefined,
  ): SupportContext<true> {
    const path =
      this.store.mutator.players[opp ? flip(this.who) : this.who].createSupport(
        support,
      );
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
    tag?: CardTag | undefined,
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
    const chPaths = getCharactersFromSelector(
      this.store.state,
      this.who,
      target,
    );
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
    this.store.mutator.players[flip(this.who)].skipNextTurn();
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
    public readonly path: CharacterPath,
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
      (c) => c.entityId === this.entityId,
    );
  }

  findEquipment(
    equipment: number | "artifact" | "weapon",
  ): EquipmentContext<true> | null {
    const eqs = findEntity(this.store.state, this.path, "equipment", (e) => {
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
  equip(equipment: number): EntityContextImpl {
    let eq: EntityPath = null!;
    this.store.updateCharacterAtPath(this.path, (ch, chPath) => {
      eq = createEquipment(ch, chPath, equipment);
    });
    this.store.mutator.emitEvent("onEnter", eq);
    return new EntityContextImpl(this.store, this.caller, eq);
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
    if (this.character.defeated) {
      this.store.mutator.revive(this.caller, this.path, amount);
    } else {
      this.store.mutator.heal(this.caller, this.path, amount);
    }
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
    this.store.mutator.emitEvent("onEnter", st);
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
    const results = findEntity(
      this.store.state,
      this.path,
      "status",
      (s) => s.info.id === status,
    );
    return results.length > 0
      ? new EntityContextImpl(this.store, this.caller, results[0][1])
      : null;
  }
  findShield(): StatusContext<true> {
    const results = findEntity(
      this.store.state,
      this.path,
      "status",
      (s) => s.info.shield !== null,
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
    private path: EntityPath,
  ) {}

  private get entity(): AllEntityState {
    return getEntityAtPath(this.store.state, this.path);
  }

  getState() {
    return this.entity.state;
  }
  setState(prop: string, newValue: unknown) {
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
      this.path.character,
    );
  }
  dispose(): void {
    this.store.updateEntityAtPath(this.path, (s) => {
      s.shouldDispose = true;
    });
  }
}

class SwitchActiveContextImpl implements SwitchActiveContext<true> {
  from?: CharacterContext<true>;
  to: CharacterContext<true>;
  constructor(
    private store: Store,
    private caller: EntityPath,
    private who: 0 | 1,
    from: CharacterPath | null,
    to: CharacterPath,
  ) {
    // super(store, caller);
    if (from) {
      this.from = new CharacterContextImpl(store, caller, from);
    }
    this.to = new CharacterContextImpl(store, caller, to);
  }
}

export class UseDiceContextImpl implements UseDiceContext {
  switchActiveCtx?: SwitchActiveContext;
  useSkillCtx?: SkillContext;
  playCardCtx?: PlayCardContext;

  constructor(
    private store: Store,
    private caller: EntityPath,
    private who: 0 | 1,
    private action: ActionConfig,
  ) {
    switch (action.type) {
      case "switchActive": {
        this.switchActiveCtx = new SwitchActiveContextImpl(
          store,
          caller,
          this.who,
          action.from,
          action.to,
        );
        break;
      }
      case "useSkill": {
        this.useSkillCtx = new SkillContextImpl(
          store,
          caller,
          this.who,
          action.skill,
        );
        break;
      }
      case "playCard": {
        this.playCardCtx = new PlayCardContextImpl(
          store,
          caller,
          this.who,
          action.card,
          action.targets,
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
    private who: 0 | 1,
    private skill: SkillPath,
  ) {}

  get id(): any {
    return this.skill.info.id;
  }

  get character() {
    return new CharacterContextImpl(
      this.store,
      this.caller,
      this.skill.character,
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
      return new PlayCardContextImpl(
        this.store,
        this.caller,
        this.who,
        this.caller,
        [this.skill.character],
      );
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
    return this.store.state.skillDamageLog
      .filter((damage) => damage.source.type === "skill")
      .map(
        (dmg) =>
          new DamageContextImpl(
            this.store,
            this.caller,
            new Damage(
              dmg.source,
              dmg.target,
              dmg.value,
              dmg.type,
              dmg.triggeredByReaction ?? undefined,
            ),
          ),
      );
  }
  getAllDescendingDamages(): DamageContext[] {
    return this.store.state.skillDamageLog.map(
      (dmg) =>
        new DamageContextImpl(
          this.store,
          this.caller,
          new Damage(
            dmg.source,
            dmg.target,
            dmg.value,
            dmg.type,
            dmg.triggeredByReaction ?? undefined,
          ),
        ),
    );
  }
  getAllDescendingReactions(): ElementalReactionContext[] {
    return this.store.state.skillReactionLog.map(
      (r) => new ElementalReactionContextImpl(this.store, this.caller, r),
    );
  }
}

export class PlayCardContextImpl implements PlayCardContext {
  targetCtxs: CardTarget[keyof CardTarget][] = [];

  constructor(
    private store: Store,
    private caller: EntityPath,
    private who: 0 | 1,
    public readonly card: CardPath,
    private readonly targetObj: PlayCardTargetPath[],
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
    const result = this.card.info.filter(
      mixinExt(this.store, this.caller, this),
    );
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
  constructor(
    private store: Store,
    private caller: EntityPath,
    private who: 0 | 1,
    private config: RollPhaseConfig,
  ) {}

  fixDice(...dice: DiceType[]): void {
    this.config.controlled.push(...dice);
  }

  addRerollCount(count: number): void {
    this.config.times += count;
  }
}

class ElementalReactionContextImpl implements ElementalReactionContext {
  constructor(
    private store: Store,
    private caller: EntityPath,
    private reaction: Reaction,
  ) {}
  get reactionType() {
    return this.reaction;
  }

  relatedWith(d: DamageType): boolean {
    const aura = d as number as Aura;
    if (!(aura in REACTION_MAP)) return false;
    return !!Object.values(REACTION_MAP[aura]).find(
      ([, r]) => r === this.reaction,
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
    private damage: Damage,
  ) {}

  get sourceSummon() {
    if (this.damage.source.type === "summon") {
      return new EntityContextImpl(this.store, this.caller, this.damage.source);
    } else {
      return undefined;
    }
  }

  get sourceSkill() {
    if (this.damage.source.type === "skill") {
      return new SkillContextImpl(
        this.store,
        this.caller,
        this.damage.source.who,
        this.damage.source,
      );
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
      this.damage.target,
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
    private who: 0 | 1,
    private token: RequestFastToken,
  ) {}

  requestFast(condition?: boolean | undefined): void {
    if (this.token.resolved) {
      throw new Error("Token already resolved");
    }
    if (typeof condition === "undefined" || condition === true) {
      this.token.resolved = true;
    }
  }
}

export interface DefeatedToken {
  immune: {
    source: EntityPath;
    healTo: number;
  } | null;
}

class DefeatedContextImpl implements BeforeDefeatedContext {
  constructor(
    private store: Store,
    private caller: EntityPath,
    private character: CharacterPath,
    private token: DefeatedToken,
  ) {}

  immune(healTo: number): void {
    if (this.token.immune !== null) {
      throw new Error("Already immune");
    }
    this.token.immune = {
      source: this.caller,
      healTo,
    };
  }
}

class TrivialPlayerContextImpl {
  constructor(
    private store: Store,
    private caller: EntityPath,
    private who: 0 | 1,
  ) {}
}

class TrivialCharacterContextImpl {
  constructor(
    private store: Store,
    private caller: EntityPath,
    private character: CharacterPath,
  ) {}
}

class EnterContextImpl {
  constructor(
    private store: Store,
    private caller: EntityPath,
    private target: EntityPath,
  ) {}
}

type ExtCtor = new (store: Store, caller: EntityPath, ...args: any[]) => object;
type CtorParameter<T> = T extends new (
  store: Store,
  caller: EntityPath,
  ...args: infer Args
) => unknown
  ? Args
  : [];
type ListenChecker<T> = (
  state: GameState,
  caller: EntityPath,
  ...args: CtorParameter<T>
) => boolean;

export function mixinExt<T extends object>(
  store: Store,
  caller: EntityPath,
  extCtx: T,
): Context<object, T, true> {
  const ctx = new ContextImpl(store, caller);
  return new Proxy(ctx, {
    get(target, prop, receiver) {
      if (prop in extCtx) {
        return Reflect.get(extCtx, prop, receiver);
      } else {
        return Reflect.get(target, prop, receiver);
      }
    },
  }) as any;
}

function buildCreator<T extends ExtCtor = typeof ContextImpl>(
  ext?: T,
  checker?: ListenChecker<T>,
) {
  return (...extArgs: CtorParameter<T>): ContextFactory => {
    return (store: Store, caller: EntityPath) => {
      if (checker && !checker(store.state, caller, ...extArgs)) {
        return null;
      }
      if (ext) {
        const extCtx = new ext(store, caller, ...extArgs);
        return mixinExt(store, caller, extCtx);
      } else {
        return new ContextImpl(store, caller);
      }
    };
  };
}

function commonPlayerChecker(state: GameState, caller: EntityPath, who: 0 | 1) {
  if ("listenTo" in caller.info && caller.info.listenTo === "all") {
    return true;
  }
  return caller.who === who;
}

function commonCharacterChecker(
  state: GameState,
  caller: EntityPath,
  character: CharacterPath,
) {
  if (!("listenTo" in caller)) {
    return false;
  }
  if (caller.listenTo === "all") {
    return true;
  }
  if ("character" in caller && caller.listenTo === "master") {
    return caller.character.entityId === character.entityId;
  }
  return caller.who === character.who;
}

function enterEventChecker(
  state: GameState,
  caller: EntityPath,
  target: EntityPath,
) {
  return (
    "entityId" in caller &&
    "entityId" in target &&
    caller.entityId === target.entityId
  );
}

function damageEventChecker(from: "source" | "target") {
  return (state: GameState, caller: EntityPath, damage: Damage) => {
    if (caller.type === "card" || caller.type === "skill") {
      return false;
    }
    if (caller.info.listenTo === "all") {
      return true;
    }
    if (from === "source") {
      // 造成伤害方
      if (
        damage.source.type === "skill" &&
        typeof damage.triggeredByReaction === "undefined"
      ) {
        // 角色技能引发伤害
        if ("character" in caller && caller.info.listenTo === "master") {
          // 角色状态、装备、被动技能，且只监听自身
          return caller.character.entityId === damage.source.character.entityId;
        } else {
          return caller.who === damage.source.who;
        }
      } else {
        // 状态或召唤物引发伤害；元素反应伤害
        return caller.who === damage.source.who;
      }
    } else {
      // 受到伤害方
      if ("character" in caller && caller.info.listenTo === "master") {
        // 角色状态、装备、被动技能，且只监听自身
        return caller.character.entityId === damage.target.entityId;
      } else {
        return caller.who === damage.source.who;
      }
    }
  };
}

type Creator = (...args: any[]) => ContextFactory;

export const CONTEXT_CREATORS = {
  onBattleBegin: buildCreator(),
  onRollPhase: buildCreator(RollContextImpl, commonPlayerChecker),
  onActionPhase: buildCreator(),
  onEndPhase: buildCreator(),

  onBeforeAction: buildCreator(TrivialPlayerContextImpl, commonPlayerChecker),
  onBeforeUseDice: buildCreator(UseDiceContextImpl, commonPlayerChecker),
  onRequestFastSwitchActive: buildCreator(
    RequestFastSwitchContextImpl,
    commonPlayerChecker,
  ),
  onUseSkill: buildCreator(SkillContextImpl, commonPlayerChecker),
  onSwitchActive: buildCreator(SwitchActiveContextImpl, commonPlayerChecker),
  onPlayCard: buildCreator(PlayCardContextImpl, commonPlayerChecker),
  onDeclareEnd: buildCreator(TrivialPlayerContextImpl, commonPlayerChecker),
  onAction: buildCreator(TrivialPlayerContextImpl, commonPlayerChecker),

  onEarlyBeforeDealDamage: buildCreator(
    DamageContextImpl,
    damageEventChecker("source"),
  ),
  onBeforeDealDamage: buildCreator(
    DamageContextImpl,
    damageEventChecker("source"),
  ),
  onBeforeSkillDamage: buildCreator(
    SkillDamageContextImpl,
    damageEventChecker("source"),
  ),
  onBeforeDamaged: buildCreator(
    DamageContextImpl,
    damageEventChecker("target"),
  ),

  onDealDamage: buildCreator(DamageContextImpl, damageEventChecker("source")),
  onDamaged: buildCreator(DamageContextImpl, damageEventChecker("target")),
  onElementalReaction: buildCreator(ElementalReactionContextImpl),
  onBeforeDefeated: buildCreator(DefeatedContextImpl, commonCharacterChecker),
  onDefeated: buildCreator(TrivialCharacterContextImpl, commonCharacterChecker),
  onRevive: buildCreator(TrivialCharacterContextImpl, commonCharacterChecker),

  onEnter: buildCreator(EnterContextImpl, enterEventChecker),
} satisfies Record<EventNames, Creator>;

type ContextCreator = typeof CONTEXT_CREATORS;

export type CreatorArgs<E extends EventNames> = Parameters<ContextCreator[E]>;
export type CreatorArgsForPlayer<E extends EventNames> = Parameters<
  ContextCreator[E]
> extends [0 | 1, ...infer Args]
  ? Args
  : never;
