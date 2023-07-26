import {
  CardInfo,
  CharacterInfo,
  EquipmentInfo,
  EventHandlers,
  PassiveSkillInfo,
  SkillInfo,
  StatusInfo,
  SummonInfo,
  SupportInfo,
  getCard,
  getCharacter,
  getEquipment,
  getSkill,
  getStatus,
  getSummon,
  getSupport,
} from "@gi-tcg/data";
import { Aura, DiceType, PhaseType } from "@gi-tcg/typings";
import {
  AllEntityState,
  EntityPath,
  EquipmentState,
  PassiveSkillState,
  StatefulEntity,
  StatusState,
  SummonState,
  SupportState,
  createEntity,
  newEntityId,
} from "./entity.js";
import { PlayerConfig } from "./game_interface.js";
import * as  _ from "lodash-es";
import { produce, Draft } from "immer";

export interface GameState {
  readonly phase: PhaseType;
  readonly roundNumber: number;
  readonly currentTurn: 0 | 1;
  readonly winner: 0 | 1 | null;
  readonly players: readonly [PlayerState, PlayerState];
}

export interface PlayerState {
  readonly piles: readonly CardState[];
  readonly activeIndex: number | null;
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
    piles,
    activeIndex: null,
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
  updateFn: <T extends AllEntityState>(e: T) => T
): AllEntityState;
function getEntityAtPath(
  state: GameState | Draft<GameState>,
  path: EntityPath,
  updateFn?: <T extends AllEntityState>(e: T) => T
): AllEntityState {
  if (path.type === "skill" || path.type === "card") {
    throw new Error("Virtual entity cannot be found at game state");
  }
  const player = state.players[path.who];
  let val: readonly AllEntityState[] | AllEntityState[];
  if ("characterEntityId" in path) {
    let ch: CharacterState | undefined =
      player.characters[path.characterIndexHint];
    if (!ch || ch.entityId !== path.characterEntityId) {
      ch = player.characters.find(
        (ch) => ch.entityId === path.characterEntityId
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
    idx = val.findIndex((e) => e.entityId === path.entityId);
  }
  if (idx === -1) {
    throw new Error("Entity not found");
  }
  if (updateFn) {
    (val[idx] as AllEntityState) = updateFn(val[idx]);
  }
  obj = val[idx];
  return val[idx];
}

export class Store {
  private constructor(private _state: GameState) {}

  static initialState(players: [PlayerConfig, PlayerConfig]) {
    const state: GameState = {
      phase: "initHands",
      roundNumber: 0,
      currentTurn: 0,
      players: [createPlayer(players[0]), createPlayer(players[1])],
      winner: null,
    };
    return new Store(state);
  }

  clone() {
    return new Store(this._state);
  }

  updateState(fn: (draft: Draft<GameState>) => void) {
    this._state = produce(this._state, fn);
  }

  updatePlayer(who: 0 | 1, fn: (draft: Draft<PlayerState>) => void) {
    this._state = produce(this._state, (state) => {
      fn(state.players[who]);
    });
  }

  updateEntityAtPath(
    path: EntityPath,
    fn: <T extends AllEntityState>(entity: T) => T
  ) {
    this._state = produce(this._state, (state) => {
      getEntityAtPath(state, path, fn);
    });
  }

  get state() {
    return this._state;
  }

}
