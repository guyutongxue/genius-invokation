import {
  CardInfoWithId,
  CharacterInfoWithId,
  EquipmentInfoWithId,
  EventHandlers,
  PassiveSkillInfo,
  SkillInfoWithId,
  StatusInfoWithId,
  SummonInfoWithId,
  SupportInfoWithId,
  getCard,
  getCharacter,
  getEquipment,
  PassiveSkillInfoWithId,
  getSkill,
  getStatus,
  getSummon,
  getSupport,
} from "@gi-tcg/data";
import { Aura, DiceType, PhaseType } from "@gi-tcg/typings";
import { List, Record, RecordOf } from "immutable";
import { newEntityId } from "./entity.js";
import { GameOptions, PlayerConfig } from "./game.js";

interface GameState {
  phase: PhaseType;
  roundNumber: number;
  currentTurn: 0 | 1;
  winner: 0 | 1 | null;
  players: List<PlayerState>;
}

interface PlayerState {
  piles: List<CardState>;
  activeIndex: number | null;
  hands: List<CardState>;
  characters: List<CharacterState>;
  combatStatuses: List<StatusState>;
  supports: List<SupportState>;
  summons: List<SummonState>;
  dice: List<DiceType>;
  declaredEnd: boolean;
  hasDefeated: boolean;
  canPlunging: boolean;
  legendUsed: boolean;
  skipNextTurn: boolean;
}

interface CardState {
  entityId: number;
  info: CardInfoWithId;
}
const CardRecord = Record<CardState>({
  entityId: 0,
  info: null!,
});
function createCard(id: number) {
  return CardRecord({ entityId: newEntityId(), info: getCard(id) });
}

interface CharacterState {
  entityId: number;
  info: CharacterInfoWithId;
  health: number;
  defeated: boolean;
  energy: number;
  equipments: List<EquipmentState>;
  statuses: List<StatusState>;
  aura: Aura;
  skills: List<SkillState>;
  passiveSkills: List<PassiveSkillState>;
}
const CharacterRecord = Record<CharacterState>({
  entityId: 0,
  info: null!,
  health: 0,
  defeated: false,
  energy: 0,
  equipments: List(),
  statuses: List(),
  aura: Aura.None,
  skills: List(),
  passiveSkills: List(),
});
function createCharacter(id: number) {
  const info = getCharacter(id);
  const skills = info.skills.map((id) => getSkill(id));
  const normalSkills = List(skills.filter((skill) => skill.type !== "passive"));
  const passiveSkills = List(
    skills.filter(
      (skill): skill is PassiveSkillInfoWithId => skill.type === "passive"
    )
  );
  return CharacterRecord({
    entityId: newEntityId(),
    info,
    health: info.maxHealth,
    skills: normalSkills.map((skill) =>
      SkillRecord({ entityId: newEntityId(), info: skill })
    ),
    passiveSkills: passiveSkills.map((skill) =>
      PassiveSkillRecord({ entityId: newEntityId(), info: skill })
    ),
  });
}

interface StatefulEntity<InfoT> {
  entityId: number;
  info: InfoT;
  handler: EventHandlers;
  usagePerRound: number;
  usage: number;
  duration: number;
  shouldDispose: boolean;
}

interface SkillState {
  entityId: number;
  info: SkillInfoWithId;
}
const SkillRecord = Record<SkillState>({
  entityId: 0,
  info: null!,
});

const StatefulEntityDefault: StatefulEntity<any> = {
  entityId: 0,
  info: null,
  handler: {},
  usagePerRound: Infinity,
  usage: Infinity,
  duration: Infinity,
  shouldDispose: false,
};

type EquipmentState = StatefulEntity<EquipmentInfoWithId>;
const EquipmentRecord = Record<EquipmentState>(StatefulEntityDefault);

type StatusState = StatefulEntity<StatusInfoWithId>;
const StatusRecord = Record<StatusState>(StatefulEntityDefault);

type SupportState = StatefulEntity<SupportInfoWithId>;
const SupportRecord = Record<SupportState>(StatefulEntityDefault);

type SummonState = StatefulEntity<SummonInfoWithId>;
const SummonRecord = Record<SummonState>(StatefulEntityDefault);

type PassiveSkillState = StatefulEntity<PassiveSkillInfo>;
const PassiveSkillRecord = Record<PassiveSkillState>(StatefulEntityDefault);

const PlayerRecord = Record<PlayerState>({
  piles: List(),
  activeIndex: null,
  hands: List(),
  characters: List(),
  combatStatuses: List(),
  supports: List(),
  summons: List(),
  dice: List(),
  declaredEnd: false,
  hasDefeated: false,
  canPlunging: false,
  legendUsed: false,
  skipNextTurn: false,
});

const GameRecord = Record<GameState>({
  phase: "initHands",
  roundNumber: 0,
  currentTurn: 0,
  players: null!,
  winner: null,
});

function createPlayer(playerConfig: PlayerConfig) {
  let player = PlayerRecord({
    piles: List(playerConfig.deck.actions).map(createCard),
    characters: List(playerConfig.deck.characters).map(createCharacter),
  });
  return player;
}

export class Store {
  private state: RecordOf<GameState>;
  constructor(options: GameOptions, players: [PlayerConfig, PlayerConfig]) {
    this.state = GameRecord({
      players: List(players).map(createPlayer),
    });
  }
}
