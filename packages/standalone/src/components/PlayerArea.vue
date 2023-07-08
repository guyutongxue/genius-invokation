<script lang="ts" setup>
import { Action, DiceType, RpcRequest } from "@gi-tcg/typings";
import images from "../assets/images.json";
import Dice from "./Dice.vue";
import HandCard from "./HandCard.vue";
import { computed } from "vue";
import { MyPlayerData, OppPlayerData } from "@gi-tcg/typings";

const props = defineProps<{
  player: "me" | "opp";
  name?: string;
  data: MyPlayerData | OppPlayerData;
  availableActions: Action[];
}>();

const emit = defineEmits<{
  (e: "clickCharacter", id: number): void;
  (e: "clickMethod", name: string): void;
  (e: "clickHand", id: number): void;
  (e: "tuneHand", id: number): void;
  (e: "clickEnd"): void;
}>();

function clickHand(cardId: number) {
  if (
    props.availableActions.find(
      (c) => c.type === "playCard" && c.card === cardId
    )
  ) {
    emit("clickHand", cardId);
  }
}
function tuneHand(cardId: number) {
  if (props.availableActions.find((c) => c.type === "elementalTuning")) {
    emit("tuneHand", cardId);
  }
}

function clickCharacter(id: number) {
  if (props.availableActions?.switchActive?.targets.includes(id)) {
    emit("clickCharacter", id);
  }
}

function handCost(id: number): [DiceType, number][] {
  const card = props.availableActions?.cards.find((c) => c.id === id);
  if (!card) return [[DiceType.Void, 0]]; // TODO
  return toCostMap(card.cost);
}

function toCostMap(cost: number[]): [DiceType, number][] {
  const costMap = new Map<DiceType, number>();
  for (const c of cost ?? []) {
    costMap.set(c, (costMap.get(c) ?? 0) + 1);
  }
  if (costMap.size === 0) return [[DiceType.Void, 0]];
  return [...costMap.entries()];
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
                ? 'outline outline-4 outline-green-400 cursor-pointer '
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
      <div class="flex flex-wrap gap-3">
        <div v-for="hand of data.hands">
          <div
            class="w-12 flex flex-col"
            @click="clickHand(hand)"
            :class="
              availableActions &&
              availableActions.cards.find((c) => c.id === hand)
                ? 'outline outline-4 outline-green-400 cursor-pointer'
                : ''
            "
          >
            <HandCard
              :objectId="Math.floor(hand)"
              :cost="handCost(hand)"
            ></HandCard>
          </div>
          <button
            v-if="availableActions?.myTurn"
            class="text-green-400 font-bold"
            @click="tuneHand(hand)"
          >
            Tune
          </button>
        </div>
      </div>
      <div>
        <ul v-if="availableActions" class="flex gap-2">
          <li
            v-for="skill of availableActions.skills"
            class="outline outline-4 outline-green-400 cursor-pointer"
            @click="emit('clickMethod', skill.name)"
          >
            {{ skill.name }}
            <div class="flex flex-row">
              <Dice
                v-for="[t, a] of toCostMap(skill.cost)"
                :type="t"
                :text="String(a)"
                class="scale-75"
              ></Dice>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div
      v-if="availableActions?.myTurn"
      class="absolute left-3 bg-yellow-300 outline outline-4 outline-green-400"
      :class="player === 'opp' ? 'bottom-3' : 'top-3'"
    >
      <button @click="emit('clickEnd')">End round</button>
    </div>
  </div>
</template>
