import data from "@gi-tcg/data";
import { Game, GameConfig, Version, BuilderTypes } from "@gi-tcg/core";

export type EntityConfig<TypeT extends BuilderTypes.ExEntityType> = {
  [key in keyof BuilderTypes.ExEntityState<TypeT>["variables"]]?: number;
};

type AllHandleT = BuilderTypes.HandleT<BuilderTypes.ExEntityType>;

class Ref<HandleT extends AllHandleT> {
  #_ = void 0;
};

const PLACEHOLDER: unique symbol = Symbol("PLACEHOLDER");
type PlaceHolder = typeof PLACEHOLDER;

type EntityName<TypeT extends BuilderTypes.ExEntityType> =
  | BuilderTypes.HandleT<TypeT>
  | Ref<BuilderTypes.HandleT<TypeT>>
  | PlaceHolder;

type EntitySetup<TypeT extends BuilderTypes.ExEntityType> =
  | EntityName<TypeT>
  | readonly [EntityName<TypeT>, EntityConfig<TypeT>];

type CharacterSetup = EntitySetup<"character">;
type CombatStatusSetup = EntitySetup<"combatStatus">;
type SummonSetup = EntitySetup<"summon">;
type SupportSetup = EntitySetup<"support">;
type CardSetup = EntitySetup<"card">;

export interface TestSetup {
  dataVersion?: Version;
  enableRoll?: boolean;

  myCharacters?: CharacterSetup[];
  myActiveIndex?: number;
  myCombatStatuses?: CombatStatusSetup[];
  mySummons?: SummonSetup[];
  mySupports?: SupportSetup[];
  myHands?: CardSetup[];
  myDeck?: CardSetup[];
  oppCharacters?: CharacterSetup[];
  oppActiveIndex?: number;
  oppCombatStatuses?: CombatStatusSetup[];
  oppSummons?: SummonSetup[];
  oppSupports?: SupportSetup[];
  oppHands?: CardSetup[];
  oppDeck?: CardSetup[];
}

export function setup(init: TestSetup = {}) {

}

export function ref<HandleT extends AllHandleT>(name?: HandleT): Ref<HandleT> {
  return new Ref();
}

export { PLACEHOLDER as _ };
