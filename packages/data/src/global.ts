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

  dice: readonly DiceType[];

  // 技能使用次数（迪卢克、艾琳）
  skillCount(skill: SkillHandle, allRound?: boolean): number;
  // 卡牌使用次数（本大爷还不能输）
  cardCount(card: CardHandle, allRound?: boolean): number;

  randomOne<T>(...items: T[]): T;

  this: ThisT;
}

interface GlobalAction<ThisT> extends GlobalContext<ThisT, true> {
  dealDamage<const Selector extends string>(value: number, type: DamageType, target?: ValidSelector<Selector>): void;
  applyElement<const Selector extends string>(type: DamageType, target?: ValidSelector<Selector>): void;
  createCombatStatus(status: StatusHandle, opp?: boolean): StatusContext<true>;

  summon(summon: SummonHandle): void;
  createSupport(support: SupportHandle, opp?: boolean): SupportContext<true>;

  absorbDice(indexes: number[]): DiceType[];
  rollDice(count: number): Promise<void>;
  generateDice(...dice: DiceType[]): void;
  generateRandomElementDice(count?: number): void;

  getCardCount(opp?: boolean): number;
  drawCards(count: number, opp?: boolean, tag?: CardTag): void;
  createCards(...cards: CardHandle[]): void;
  switchCards(): Promise<void>;

  switchActive<const Selector extends string>(target: ValidSelector<Selector>): void;
  useSkill(skill: SkillHandle | "normal"): Promise<void>;

  actionAgain(): void;
}

export type Context<ThisT, ExtPoint, Writable extends boolean = false> = (Writable extends true ? GlobalAction<ThisT> : GlobalContext<ThisT>) & ExtPoint;
