import { DamageType } from "@jenshin-tcg/typings";
import { Status } from "../character";


export interface DescriptionContext {
  damage(value: number, type: DamageType): void;
  createStatus(status: Status): void;
  createCombatStatus(status: Status): void;
  summon(summon: unknown): void;
}
