import {
  CardInfo,
  CharacterInfo,
  PassiveSkillInfo,
  getCard,
  getCharacter,
  getSkill,
} from "@gi-tcg/data";
import {
  Aura,
  DiceType,
  PhaseType,
  Reaction,
  StateData,
} from "@gi-tcg/typings";
import {
  AllEntityState,
  EntityPath,
  EntityType,
  EntityUpdateFn,
  EquipmentState,
  PassiveSkillState,
  StateOfEntity,
  StatefulEntity,
  StatusState,
  SummonState,
  SupportState,
  createEntity,
  newEntityId,
} from "./entity.js";
import { GameOptions, PlayerConfig } from "./game_interface.js";
import * as _ from "lodash-es";
import { produce, createDraft, finishDraft, Draft } from "immer";
import { PlayerMutator, getPlayerData } from "./player.js";
import { PlayerIO, createIO } from "./io.js";
import { CharacterPath, CharacterUpdateFn } from "./character.js";
import { Mutator } from "./mutator.js";
import { flip } from "@gi-tcg/utils";
import { DamageDetail } from "./damage.js";

type ValidConfigKey<Obj extends object> = {
  [K in keyof Obj]: Exclude<Obj[K], undefined> extends Function ? never : K;
}[keyof Obj];

type NoFunction<Obj extends object> = {
  readonly [K in ValidConfigKey<Obj>]: Exclude<Obj[K], undefined>;
};

export interface GameState {
  readonly config: NoFunction<GameOptions>;
  readonly phase: PhaseType;
  readonly roundNumber: number;
  readonly currentTurn: 0 | 1;
  readonly winner: 0 | 1 | null;
  readonly players: readonly [PlayerState, PlayerState];
  readonly skillDamageLog: DamageDetail[]; // 使用技能前清空
  readonly skillReactionLog: Reaction[]; // 使用技能前清空
}

export interface PlayerState {
  readonly config: Omit<NoFunction<PlayerConfig>, "deck">;
  readonly piles: readonly CardState[];
  readonly active: Readonly<CharacterPath> | null;
  readonly hands: readonly CardState[];
  readonly characters: readonly CharacterState[];
  readonly combatStatuses: readonly StatusState[];
  readonly supports: readonly SupportState[];
  readonly summons: readonly SummonState[];
  readonly dice: readonly DiceType[];
  readonly declaredEnd: boolean;
  readonly hasDefeated: boolean;
  readonly canPlunging: boolean;
  readonly legendUsed: boolean;
  readonly skipNextTurn: boolean;
  readonly skillLog: number[]; // 每回合清空
  readonly cardLog: number[]; // 每回合清空
}

export interface CardState {
  readonly entityId: number;
  readonly info: CardInfo;
}
export interface CharacterState {
  readonly entityId: number;
  readonly info: CharacterInfo;
  readonly health: number;
  readonly defeated: boolean;
  readonly energy: number;
  readonly equipments: readonly EquipmentState[];
  readonly statuses: readonly StatusState[];
  readonly aura: Aura;
  readonly passiveSkills: readonly PassiveSkillState[];
}

export function createCharacter(id: number): CharacterState {
  const info = getCharacter(id);
  const skills = info.skills.map((id) => getSkill(id));
  const normalSkills = skills.filter((skill) => skill.type !== "passive");
  const passiveSkills = skills
    .filter((skill): skill is PassiveSkillInfo => skill.type === "passive")
    .map((e) => createEntity("passive_skill", e.id));
  return {
    entityId: newEntityId(),
    info,
    health: info.maxHealth,
    defeated: false,
    energy: 0,
    equipments: [],
    statuses: [],
    aura: Aura.None,
    passiveSkills,
  };
}

function createPlayer(playerConfig: PlayerConfig): PlayerState {
  let piles = playerConfig.deck.actions.map((card) => ({
    entityId: newEntityId(),
    info: getCard(card),
  }));
  if (!playerConfig.noShuffle) {
    piles = _.shuffle(piles);
  }
  return {
    config: {
      alwaysOmni: playerConfig.alwaysOmni ?? false,
      noShuffle: playerConfig.noShuffle ?? false,
    },
    piles,
    active: null,
    hands: [],
    characters: playerConfig.deck.characters.map(createCharacter),
    combatStatuses: [],
    supports: [],
    summons: [],
    dice: [],
    declaredEnd: false,
    hasDefeated: false,
    canPlunging: false,
    legendUsed: false,
    skipNextTurn: false,
    skillLog: [],
    cardLog: [],
  };
}

export function getEntityAtPath(
  state: GameState,
  path: EntityPath,
): AllEntityState;
export function getEntityAtPath<T extends AllEntityState>(
  state: Draft<GameState>,
  path: EntityPath,
  updateFn: EntityUpdateFn<T>,
): AllEntityState;
export function getEntityAtPath(
  state: GameState | Draft<GameState>,
  path: EntityPath,
  updateFn?: EntityUpdateFn,
): AllEntityState {
  if (path.type === "skill" || path.type === "card") {
    throw new Error("Virtual entity cannot be found at game state");
  }
  const player = state.players[path.who];
  let val: readonly AllEntityState[] | AllEntityState[];
  if ("character" in path) {
    let ch = getCharacterAtPath(state, path.character);
    let prop: "equipments" | "statuses" | "passiveSkills";
    switch (path.type) {
      case "equipment":
        prop = "equipments";
        break;
      case "status":
        prop = "statuses";
        break;
      case "passive_skill":
        prop = "passiveSkills";
        break;
    }
    val = ch[prop];
  } else {
    let prop: "combatStatuses" | "summons" | "supports";
    switch (path.type) {
      case "status":
        prop = "combatStatuses";
        break;
      case "summon":
        prop = "summons";
        break;
      case "support":
        prop = "supports";
        break;
    }
    val = player[prop];
  }
  let idx = path.indexHint;
  let obj: AllEntityState | undefined = val[idx];
  if (!obj || obj.entityId !== path.entityId) {
    obj = val.find((e) => e.entityId === path.entityId);
  }
  if (!obj) {
    throw new Error("Entity not found");
  }
  if (updateFn) {
    updateFn(obj, path);
  }
  return obj;
}

export type DraftWithResource<T> = Draft<T> & {
  [Symbol.dispose]: () => void;
};

export class Store {
  private playerIO: readonly [PlayerIO | null, PlayerIO | null] = [null, null];
  private constructor(private _state: GameState) {}

  readonly mutator = new Mutator(this, this.playerIO);

  /**
   * 创建正式游戏的 store（包含 IO）
   * @param gameOption 对局选项
   * @param players 玩家选项
   * @returns 
   */
  static initialState(
    gameOption: GameOptions,
    players: readonly [PlayerConfig, PlayerConfig],
  ): Store {
    const state: GameState = {
      config: gameOption,
      phase: "initHands",
      roundNumber: 0,
      currentTurn: 0,
      players: [createPlayer(players[0]), createPlayer(players[1])],
      winner: null,
      skillDamageLog: [],
      skillReactionLog: [],
    };
    const store = new Store(state);
    store.playerIO = createIO(store, players);
    return store;
  }

  /**
   * 创建一个临时 store，已给定的 state 作为初始状态。不含 IO。
   * @param state 初始状态
   * @returns 临时 store
   */
  static fromState(state: GameState) {
    return new Store(state);
  }

  /**
   * 等价于 `Store.fromState(this.state)`，复制本对象的 state 以创建一个不含 IO 的临时 store。
   * 
   * 用于手牌筛选、beforeUseDice、伤害预览等场合。
   * @returns 临时 store
   */
  clone() {
    return Store.fromState(this._state);
  }
  apply(state: GameState) {
    this._state = state;
  }

  _produce(fn: (draft: Draft<GameState>) => void) {
    this._state = produce(this._state, fn);
  }

  updateEntityAtPath<T extends AllEntityState>(
    path: EntityPath,
    fn: EntityUpdateFn<T>,
  ) {
    this._produce((draft) => getEntityAtPath(draft, path, fn));
  }
  updateCharacterAtPath(path: CharacterPath, fn: CharacterUpdateFn) {
    this._produce((draft) => getCharacterAtPath(draft, path, fn));
  }

  get state() {
    return this._state;
  }

  private drafting = false;
  private finishDraft(draft: Draft<GameState>) {
    this._state = finishDraft(draft);
    this.drafting = false;
  }

  createDraft(): DraftWithResource<GameState> {
    if (this.drafting) {
      throw new Error("Cannot create draft while another draft is in progress");
    }
    this.drafting = true;
    const draft = createDraft(this._state);
    Object.defineProperty(draft, Symbol.dispose, {
      value: () => this.finishDraft(draft),
    });
    return draft as DraftWithResource<GameState>;
  }
  createDraftForPlayer(who: 0 | 1): DraftWithResource<PlayerState> {
    if (this.drafting) {
      throw new Error("Cannot create draft while another draft is in progress");
    }
    this.drafting = true;
    const draft = createDraft(this._state);
    const player = draft.players[who];
    Object.defineProperty(player, Symbol.dispose, {
      value: () => this.finishDraft(draft),
    });
    return player as DraftWithResource<PlayerState>;
  }
}

function playerCharacterSeq(
  player: PlayerState,
  who: 0 | 1,
): [CharacterState, CharacterPath][] {
  let activeIndex = player.characters.findIndex(
    (ch) => ch.entityId === player.active?.entityId,
  );
  if (activeIndex === -1) {
    activeIndex = 0;
  }
  const result: [CharacterState, CharacterPath][] = [];
  for (let i = 0; i < player.characters.length; i++) {
    const ch = player.characters[(i + activeIndex) % player.characters.length];
    result.push([
      ch,
      {
        who: who,
        entityId: ch.entityId,
        indexHint: i,
        info: ch.info,
      },
    ]);
  }
  return result;
}

export function getCharacterAtPath(
  state: Draft<GameState>,
  path: CharacterPath,
  updateFn: CharacterUpdateFn,
): CharacterState;
export function getCharacterAtPath(
  state: GameState | PlayerState,
  path: CharacterPath,
): CharacterState;
export function getCharacterAtPath(
  state: Draft<GameState> | GameState | PlayerState,
  path: CharacterPath,
  updateFn?: CharacterUpdateFn,
): CharacterState {
  const { who, entityId, indexHint } = path;
  const chs = ("players" in state ? state.players[who] : state).characters;
  let ch;
  if (chs[indexHint].entityId === entityId) {
    ch = chs[indexHint];
  } else {
    ch = chs.find((ch) => ch.entityId === entityId);
    if (!ch) {
      throw new Error("Character not found");
    }
  }
  if (updateFn) {
    updateFn(ch as Draft<CharacterState>, path);
  }
  return ch;
}

export function findEntity<T extends "equipment" | "status">(
  state: GameState,
  characterPath: CharacterPath,
  type: T,
  pred: (s: StateOfEntity<T>) => boolean,
): [StateOfEntity<T>, EntityPath][];
export function findEntity<T extends "status" | "summon" | "support">(
  state: GameState,
  who: 0 | 1,
  type: T,
  pred: (s: StateOfEntity<T>) => boolean,
): [StateOfEntity<T>, EntityPath][];
export function findEntity(
  state: GameState,
  whoOrCh: 0 | 1 | CharacterPath,
  type: EntityType,
  pred: (s: any) => boolean,
): [AllEntityState, EntityPath][] {
  let base: readonly AllEntityState[];
  if (typeof whoOrCh === "number") {
    base =
      state.players[whoOrCh][
        type === "status"
          ? "combatStatuses"
          : type === "summon"
          ? "summons"
          : "supports"
      ];
  } else {
    base = getCharacterAtPath(state, whoOrCh)[
      type === "status" ? "statuses" : "equipments"
    ];
  }
  return base
    .map((a, i) => [a, i] as const)
    .filter(([a]) => pred(a))
    .map(([a, i]) => [
      a,
      <EntityPath>{
        type,
        who: typeof whoOrCh === "number" ? whoOrCh : whoOrCh.who,
        entityId: a.entityId,
        indexHint: i,
        info: a.info,
        ...(typeof whoOrCh === "number" ? {} : { character: whoOrCh }),
      },
    ]);
}

export function findCharacter(
  state: GameState,
  who: 0 | 1 | "all",
  pred: (s: CharacterState) => boolean,
): [CharacterState, CharacterPath][] {
  if (who === "all") {
    return state.players
      .flatMap((p, i) => playerCharacterSeq(p, i as 0 | 1))
      .filter(([a]) => pred(a));
  } else {
    return playerCharacterSeq(state.players[who], who).filter(([a]) => pred(a));
  }
}

export function getData(state: GameState, who: 0 | 1): StateData {
  const playerData = getPlayerData(state.players[who]);
  const oppPlayerData = getPlayerData(state.players[flip(who)], true);
  return {
    phase: state.phase,
    turn: state.currentTurn,
    players: [playerData, oppPlayerData],
  };
}
