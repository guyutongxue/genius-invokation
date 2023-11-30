import { DamageType } from "@gi-tcg/typings";
import { CharacterTag } from "../base/character";
import { EntityTag, EntityType } from "../base/entity";
import { EntityContext, StrictlyTypedCharacterContext } from "./context";

export type CharacterHandle = number & { readonly _char: unique symbol };
export type SkillHandle = number & { readonly _skill: unique symbol };
export type CardHandle = number & { readonly _card: unique symbol };
export type EntityHandle = number & { readonly _entity: unique symbol };
export type StatusHandle = EntityHandle & { readonly _stat: unique symbol };
export type CombatStatusHandle = EntityHandle & {
  readonly _cStat: unique symbol;
};
export type SummonHandle = { readonly sm: unique symbol };
export type SupportHandle = EntityHandle &
  CardHandle & { readonly _support: unique symbol };
export type EquipmentHandle = EntityHandle &
  CardHandle & { readonly _equip: unique symbol };

export type ExEntityType = "character" | EntityType;

export type ExContextType<Readonly extends boolean, TypeT extends ExEntityType> =
  TypeT extends "character"
    ? StrictlyTypedCharacterContext<Readonly>
    : TypeT extends EntityType
    ? EntityContext<Readonly, TypeT>
    : never;
export type HandleT<T extends ExEntityType> = T extends "character"
  ? CharacterHandle
  : T extends "combatStatus"
  ? CombatStatusHandle
  : T extends "status"
  ? StatusHandle
  : T extends "summon"
  ? SummonHandle
  : T extends "support"
  ? SupportHandle
  : T extends "passiveSkill"
  ? SkillHandle
  : never;

export type ExTag<TypeT extends ExEntityType> = TypeT extends "character"
  ? CharacterTag
  : TypeT extends EntityType
  ? EntityTag
  : never;

export type AppliableDamageType =
  | DamageType.Cryo
  | DamageType.Hydro
  | DamageType.Pyro
  | DamageType.Electro
  | DamageType.Dendro;
