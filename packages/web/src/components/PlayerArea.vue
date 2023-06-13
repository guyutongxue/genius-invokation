<script lang="ts" setup>
import type {
  CharacterFacade,
  StatusFacade,
  SummonFacade,
  SupportFacade,
  DiceType,
} from "@jenshin-tcg/typings";
import Dice from "./Dice.vue";

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
      hands: number[];
      dice: DiceType[];
    }
);


const { player, name, data } = defineProps<{
  player: "me" | "opp";
  name?: string;
  data: PlayerAreaData
}>();

defineEmits<{
  clickCharacter: [id: number, objectId: number];
  clickHand: [id: number, objectId: number];
  clickEnd: [];
}>();
</script>

<template>
  <div
    class="flex border border-black gap-1"
    :class="player === 'me' ? 'flex-col' : 'flex-col-reverse'"
  >
    <div class="flex flex-row">
      <div class="bg-yellow-800 text-white p-2">{{ data.pileNumber }}</div>
      <div class="bg-blue-50">SUPPORTS</div>
      <div class="bg-white flex-grow flex justify-center gap-4">
        <div v-for="ch of data.characters">
          <div class="w-20 h-30 border-4" @click="$emit('clickCharacter', ch.id, ch.objectId)" :class="data.active === ch.id ? 'border-red-500' : 'border-transparent'">
            <img :src="`https://genshin.honeyhunterworld.com/img/i_n${320000 + ch.objectId}_gcg_high_resolution.webp`">
          </div>
        </div>
      </div>
      <div class="bg-red-50">SUMMONS</div>
      <div class="bg-yellow-800 text-white flex flex-col p-2 gap-2">
        <div v-if="data.type === 'visible'">
          <div v-for="d of data.dice">
            <Dice :type="(d as DiceType)"></Dice>
          </div>
        </div>
        <div v-else>
          {{ data.diceNumber }}
        </div>
      </div>
    </div>
    <div v-if="data.type === 'visible'" class="flex flex-wrap gap-2">
      <div v-for="hand of data.hands">
        <div class="w-10 h-14" @click="$emit('clickHand', hand, Math.floor(hand))">
          {{ hand }}
        </div>
      </div>
    </div>
  </div>
</template>
