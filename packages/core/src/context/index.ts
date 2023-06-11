import { Status, DamageType } from "@jenshin-tcg/typings";


export interface DescriptionContext {
  damage(value: number, type: DamageType): void;
  createStatus(status: Status): void;
  createCombatStatus(status: Status): void;
  summon(summon: unknown): void;
}
