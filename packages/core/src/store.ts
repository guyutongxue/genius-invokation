import {
  CardInfo,
  CharacterInfo,
  PassiveSkillInfo,
  getCard,
  getCharacter,
  getSkill,
} from "@gi-tcg/data";
import { Aura, DiceType, PhaseType } from "@gi-tcg/typings";
import {
  AllEntityState,
  EntityPath,
  EntityUpdateFn,
  EquipmentState,
  PassiveSkillState,
  StatefulEntity,
  StatusState,
  SummonState,
  SupportState,
  createEntity,
  newEntityId,
} from "./entity.js";
import { GameOptions, PlayerConfig } from "./game_interface.js";
import * as  _ from "lodash-es";
import { produce, createDraft, finishDraft, Draft } from "immer";
import { PlayerMutator } from "./player.js";
import { PlayerIO } from "./io.js";
import { CharacterPath } from "./character.js";
import { Mutator } from "./mutator.js";

type ValidConfigKey<Obj extends object> = {
  [K in keyof Obj]: Exclude<Obj[K], undefined> extends Function ? never : K
}[keyof Obj];

type NoFunction<Obj extends object> = {
  readonly [K in ValidConfigKey<Obj>]: Exclude<Obj[K], undefined>
};

export interface GameState {
  readonly config: NoFunction<GameOptions>;
  readonly phase: PhaseType;
  readonly roundNumber: number;
  readonly currentTurn: 0 | 1;
  readonly winner: 0 | 1 | null;
  readonly players: readonly [PlayerState, PlayerState];
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
  };
}

function getEntityAtPath(state: GameState, path: EntityPath): AllEntityState;
function getEntityAtPath(
  state: Draft<GameState>,
  path: EntityPath,
  updateFn: EntityUpdateFn
): AllEntityState;
function getEntityAtPath(
  state: GameState | Draft<GameState>,
  path: EntityPath,
  updateFn?: EntityUpdateFn
): AllEntityState {
  if (path.type === "skill" || path.type === "card") {
    throw new Error("Virtual entity cannot be found at game state");
  }
  const player = state.players[path.who];
  let val: readonly AllEntityState[] | AllEntityState[];
  if ("character" in path) {
    let ch: CharacterState | undefined =
      player.characters[path.character.indexHint];
    if (!ch || ch.entityId !== path.character.entityId) {
      ch = player.characters.find(
        (ch) => ch.entityId === path.character.entityId
      );
    }
    if (!ch) {
      throw new Error("Character not found");
    }
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
    updateFn(obj);
  }
  return obj;
}

export type DraftWithResource<T> = Draft<T> & {
  [Symbol.dispose]: () => void;
}

export class Store {
  private constructor(private _state: GameState, private playerIO: [PlayerIO | null, PlayerIO | null]) {

  }

  readonly mutator = new Mutator(this, this.playerIO);

  static initialState(gameOption: GameOptions, players: [PlayerConfig, PlayerConfig]) {
    const state: GameState = {
      config: gameOption,
      phase: "initHands",
      roundNumber: 0,
      currentTurn: 0,
      players: [createPlayer(players[0]), createPlayer(players[1])],
      winner: null,
    };
    return new Store(state, [null, null]); // TODO
  }

  clone() {
    return new Store(this._state, [null, null]);
  }

  produce(fn: (draft: Draft<GameState>) => void) {
    this._state = produce(this._state, fn);
  }

  updateEntityAtPath(
    path: EntityPath,
    fn: EntityUpdateFn
  ) {
    using draft = this.createDraft();
    getEntityAtPath(draft, path, fn);
  }

  get state() {
    return this._state;
  }

  getCharacter(path: CharacterPath): CharacterState {
    const { who, entityId, indexHint } = path;
    const chs = this._state.players[who].characters;
    if (chs[indexHint].entityId === entityId) {
      return chs[indexHint];
    } else {
      const ch = chs.find((ch) => ch.entityId === entityId);
      if (!ch) {
        throw new Error("Character not found");
      }
      return ch;
    }
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
