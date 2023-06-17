<script lang="ts" setup>
import type {
  CharacterFacade,
  StatusFacade,
  SummonFacade,
  SupportFacade,
  DiceType,
  RequestType,
} from "@jenshin-tcg/typings";
import images from "../assets/images.json";
import Dice from "./Dice.vue";
import HandCard from "./HandCard.vue";

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
  data: PlayerAreaData;
  availableActions?: RequestType<"action">;
}>();

const emit = defineEmits<{
  (e: "clickCharacter", id: number, objectId: number): void;
  (e: "clickHand", id: number, objectId: number): void;
  (e: "clickEnd"): void;
}>();
</script>

<template>
  <div
    class="flex border border-black gap-1 relative"
    :class="player === 'opp' ? 'flex-col-reverse' : 'flex-col'"
  >
    <div class="flex flex-row">
      <div class="bg-yellow-800 text-white p-2">{{ data.pileNumber }}</div>
      <div class="bg-blue-50">SUPPORTS</div>
      <div class="bg-white flex-grow flex justify-center gap-4 p-6">
        <div
          v-for="ch of data.characters"
          :class="
            data.active === ch.id
              ? player === 'opp'
                ? 'translate-y-6'
                : '-translate-y-6'
              : ''
          "
        >
          <div class="w-20 h-30 relative">
            <div class="absolute bg-white">{{ ch.health }}</div>
            <div class="absolute right-0 bg-yellow-500">{{ ch.energy }}</div>
            <img
              :src="(images as any)[ch.objectId]"
              @click="$emit('clickCharacter', ch.id, ch.objectId)"
            />
          </div>
        </div>
      </div>
      <div class="bg-red-50">SUMMONS</div>
      <div class="bg-yellow-800 text-white flex flex-col p-2 gap-2">
        <div v-if="data.type === 'visible'">
          <div v-for="d of data.dice">
            <Dice :type="d"></Dice>
          </div>
        </div>
        <div v-else>
          {{ data.diceNumber }}
        </div>
      </div>
    </div>
    <div v-if="data.type === 'visible'" class="flex justify-between">
      <div class="flex flex-wrap gap-2">
        <div v-for="hand of data.hands">
          <div
            class="w-12"
            @click="emit('clickHand', hand, Math.floor(hand))"
            :class="
              availableActions &&
              availableActions.cards.find((c) => c.id === Math.floor(hand))
                ? 'border-4 border-green-400'
                : ''
            "
          >
            <HandCard :objectId="Math.floor(hand)"></HandCard>
          </div>
        </div>
      </div>
      <div>
        <ul v-if="availableActions" class="flex gap-2">
          <li v-for="skill of availableActions.skills" class="border-4 border-green-400">
            {{ skill.name }}
          </li>
        </ul>
      </div>
    </div>
    <div v-if="availableActions" class="absolute left-3 bg-yellow-300 border-4 border-green-400" :class="player === 'opp' ? 'bottom-3' : 'top-3'">
      <button @click="emit('clickEnd')">End turn</button>
    </div>
  </div>
</template>
