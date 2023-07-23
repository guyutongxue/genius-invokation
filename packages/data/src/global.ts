import { DamageType, DiceType } from "@gi-tcg/typings";
import { CardHandle, SkillHandle, StatusHandle, SummonHandle, SupportHandle } from "./builders";
import { CardTag } from "./cards";
import { CharacterContext } from "./characters";
import { StatusContext } from "./statuses"; 
import { SummonContext } from "./summons";
import { ValidSelector } from "./target";
import { SupportContext } from "./supports";

export enum SpecialBits {
  DeclaredEnd,
  Defeated,
  Plunging,
  LegendUsed,
  SkipTurn, // 风与自由
}

interface GlobalContext<ThisT, Writable extends boolean = false> {
  readonly currentPhase: "action" | "end" | "other";
  readonly currentTurn: number;
  isMyTurn(): boolean;
  checkSpecialBit(bit: SpecialBits): boolean;

  queryCharacter<const Selector extends string>(ch: ValidSelector<Selector>): CharacterContext<Writable> | null;
  queryCharacterAll<const Selector extends string>(ch: ValidSelector<Selector>): CharacterContext<Writable>[];

  fullSupportArea(opp?: boolean): boolean;
  findSummon(summon: SummonHandle): SummonContext<Writable> | null;
  allSummons(includeOpp?: boolean): SummonContext<Writable>[];

  findCombatStatus(status: StatusHandle): StatusContext<Writable> | null;
  findCombatShield(): StatusContext<Writable> | null;

  // 本回合中技能使用次数（迪卢克、艾琳）
  skillCount(skill: SkillHandle): number;

  this: ThisT;
}

interface GlobalAction<ThisT> extends GlobalContext<ThisT, true> {
  dealDamage<const Selector extends string>(value: number, type: DamageType, target?: ValidSelector<Selector>): void;
  applyElement<const Selector extends string>(type: DamageType, target?: ValidSelector<Selector>): void;
  createCombatStatus(status: StatusHandle, opp?: boolean): StatusContext<true>;

  summon(summon: SummonHandle): void;
  createSupport(support: SupportHandle, opp?: boolean): SupportContext<true>;

  getDice(): DiceType[];
  rollDice(count: number): Promise<void>;
  generateDice(...dice: DiceType[]): void;
  generateRandomElementDice(count?: number): void;
  removeAllDice(): DiceType[];

  getCardCount(opp?: boolean): number;
  drawCards(count: number, opp?: boolean, tag?: CardTag): void;
  createCards(...cards: CardHandle[]): void;
  switchCards(): Promise<void>;

  switchActive<const Selector extends string>(target: ValidSelector<Selector>): void;
  useSkill(skill: SkillHandle | "normal"): Promise<void>;
}

export type Context<ThisT, Writable extends boolean = false> = Writable extends true ? GlobalAction<ThisT> : GlobalContext<ThisT>;
