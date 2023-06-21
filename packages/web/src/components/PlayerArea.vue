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

export type AreaAction = Omit<RequestType<"action">, "state"> & { myTurn: boolean };

const props = defineProps<{
  player: "me" | "opp";
  name?: string;
  data: PlayerAreaData;
  availableActions?: AreaAction;
}>();

const emit = defineEmits<{
  (e: "clickCharacter", id: number): void;
  (e: "clickMethod", name: string): void;
  (e: "clickHand", id: number): void;
  (e: "tuneHand", id: number): void;
  (e: "clickEnd"): void;
}>();

function clickHand(cardId: number) {
  if (props.availableActions?.cards.find((c) => c.id === cardId)) {
    emit("clickHand", cardId);
  }
}
function tuneHand(cardId: number) {
  if (props.availableActions?.myTurn) {
    emit("tuneHand", cardId);
  }
}

function clickCharacter(id: number) {
  if (props.availableActions?.switchActive?.targets.includes(id)) {
    emit("clickCharacter", id);
  }
}
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
          <div
            class="w-20 h-30 relative"
            :class="
              availableActions?.switchActive?.targets.includes(ch.id)
                ? 'border-4 border-green-400 cursor-pointer'
                : ''
            "
            @click="clickCharacter(ch.id)"
          >
            <div class="absolute bg-white">{{ ch.health }}</div>
            <div class="absolute right-0 bg-yellow-500">{{ ch.energy }}</div>
            <img :src="(images as any)[ch.objectId]" />
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
            class="w-12 flex flex-col"
            @click="clickHand(hand)"
            :class="
              availableActions &&
              availableActions.cards.find((c) => c.id === hand)
                ? 'border-4 border-green-400 cursor-pointer'
                : ''
            "
          >
            <HandCard :objectId="Math.floor(hand)"></HandCard>
          </div>
          <button
            v-if="availableActions?.myTurn"
            class="text-green-400 font-bold"
            @click="tuneHand(hand)"
          >
            Tuning
          </button>
        </div>
      </div>
      <div>
        <ul v-if="availableActions" class="flex gap-2">
          <li
            v-for="skill of availableActions.skills"
            class="border-4 border-green-400 cursor-pointer"
            @click="emit('clickMethod', skill.name)"
          >
            {{ skill.name }}
          </li>
        </ul>
      </div>
    </div>
    <div
      v-if="availableActions?.myTurn"
      class="absolute left-3 bg-yellow-300 border-4 border-green-400"
      :class="player === 'opp' ? 'bottom-3' : 'top-3'"
    >
      <button @click="emit('clickEnd')">End turn</button>
    </div>
  </div>
</template>
