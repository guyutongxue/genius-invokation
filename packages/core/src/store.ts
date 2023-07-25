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
  EquipmentState,
  PassiveSkillState,
  StatefulEntity,
  StatusState,
  SummonState,
  SupportState,
  createEntity,
  newEntityId,
} from "./entity.js";
import { PlayerConfig } from "./game.js";
import { produce, Draft } from "immer";

interface GameState {
  readonly phase: PhaseType;
  readonly roundNumber: number;
  readonly currentTurn: 0 | 1;
  readonly winner: 0 | 1 | null;
  readonly players: readonly [PlayerState, PlayerState];
}

interface PlayerState {
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

interface CardState {
  readonly entityId: number;
  readonly info: CardInfo;
}
interface CharacterState {
  readonly entityId: number;
  readonly info: CharacterInfo;
  readonly health: number;
  readonly defeated: boolean;
  readonly energy: number;
  readonly equipments: readonly EquipmentState[];
  readonly statuses: readonly StatusState[];
  readonly aura: Aura;
  readonly skills: readonly SkillState[];
  readonly passiveSkills: readonly PassiveSkillState[];
}

function createCharacter(id: number): CharacterState {
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
    skills: normalSkills.map((skill) => ({
      entityId: newEntityId(),
      info: skill,
    })),
    passiveSkills,
  };
}

interface SkillState {
  readonly entityId: number;
  readonly info: SkillInfo;
}

function createPlayer(playerConfig: PlayerConfig): PlayerState {
  return {
    piles: playerConfig.deck.actions.map((card) => ({
      entityId: newEntityId(),
      info: getCard(card),
    })),
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

  get state() {
    return this._state;
  }

  test() {
    produce(this._state, (draft) => {
      draft.players[0].
    });
  }
}
