<script lang="ts" setup>
import { Player } from "@jenshin-tcg/core";
import type {
  CharacterFacade,
  CardFacade,
  StatusFacade,
  SummonFacade,
  SupportFacade,
  DiceType,
} from "@jenshin-tcg/typings";

export type PlayerAreaData = {
  pileNumber: number;
  active?: number;
  characters: CharacterFacade[];
  combatStatuses: StatusFacade[];
  supports: SupportFacade[];
  summons: SummonFacade[];
} & (
  | {
      type: "hidden";
      handsNumber: number;
      diceNumber: number;
    }
  | {
      type: "visible";
      hands: CardFacade[];
      dice: DiceType[];
    }
);

const props = defineProps<{
  player: "me" | "opp";
  name?: string;
  data: PlayerAreaData
}>();
</script>

<template>
  <div
    class="flex border border-black gap-1"
    :class="props.player === 'me' ? 'flex-col' : 'flex-col-reverse'"
  >
    <div class="flex flex-row">
      <div class="bg-yellow-800 text-white">PILE</div>
      <div class="bg-blue-50">SUPPORTS</div>
      <div class="bg-white flex-grow">CHARACTERS</div>
      <div class="bg-red-50">SUMMONS</div>
      <div class="bg-yellow-800 text-white">DICE</div>
    </div>
    <div>HANDS</div>
  </div>
</template>
