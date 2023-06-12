import { DamageType, DiceType } from "@jenshin-tcg/typings";

export interface CharacterInfo {
  readonly health: number;
  readonly energy: number;
  modifiers?: unknown[];
}

export type SkillType = "normal" | "skill" | "burst";

export interface SkillInfo {
  name: string;
  type: SkillType;
  costs: Record<DiceType, number>;
}

export enum DamageTarget {
  ACTIVE,
  STANDBY,
}

export interface DescriptionContext {
  damage(value: number, type: DamageType, target?: DamageTarget): void;
  createStatus(status: IStatusConstructor): void;
  createCombatStatus(status: IStatusConstructor, opposite?: boolean): void;
  summon(summon: unknown): void;
}

export interface IStatus {
  onBeforeSkill?: (c: SkillContext) => void;
  onSkill?: (c: SkillContext) => void;
}

class Character {
  health: number;
  energy: number;

  constructor(private readonly info: CharacterInfo) {
    this.health = info.health;
    this.energy = 0;
  }

  heal(value: number) {
    const newHealth = Math.max(this.info.health, this.health + value);
    // TODO: FUCK
    this.health = newHealth;
  }

  damage(value: number, type: DamageType) {
    // TODO: FUCK
    this.health -= value;
    // ELEMENTAL blahblah
  }
}

export interface SkillContext {
  character: Character;
  info: SkillInfo;
  additionalDamage: number;
}

interface IStatusConstructor {
  new (): IStatus;
}
