import { CharacterTag } from "../character";
import { EntityTag, EntityType } from "../entity";
import { CharacterContext, EntityContext } from "./context";

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

export type EntityTypeEx = "character" | EntityType;

export type ExContextType<TypeT extends EntityTypeEx> =
  TypeT extends "character"
    ? CharacterContext
    : TypeT extends EntityType
    ? EntityContext<TypeT>
    : never;
export type HandleT<T extends EntityTypeEx> = T extends "character"
  ? CharacterHandle
  : T extends "status"
  ? StatusHandle
  : T extends "summon"
  ? SummonHandle
  : T extends "support"
  ? SupportHandle
  : never;

export type ExTag<TypeT extends EntityTypeEx> = TypeT extends "character"
  ? CharacterTag
  : TypeT extends EntityType
  ? EntityTag
  : never;
