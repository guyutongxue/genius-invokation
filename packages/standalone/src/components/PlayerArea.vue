<script lang="ts" setup>
import {
  Action,
  CardData,
  CharacterData,
  DiceType,
  PlayCardAction,
  SwitchActiveAction,
  UseSkillAction,
} from "@gi-tcg/typings";
import images from "../assets/images.json";
import Dice from "./Dice.vue";
import HandCard from "./HandCard.vue";
import { computed } from "vue";
import { MyPlayerData, OppPlayerData } from "@gi-tcg/typings";

const props = defineProps<{
  name?: string;
  data: MyPlayerData | OppPlayerData;
  availableActions: Action[];
}>();

const emit = defineEmits<{
  (e: "click", actionIndex: number): void;
}>();

type WithAction = {
  cost: [DiceType, number][];
  actionIndex: number;
};

const characters = computed<Array<CharacterData & WithAction>>(() => {
  return props.data.characters.map((c) => {
    const idx = props.availableActions.findIndex(
      (a) => a.type === "switchActive" && a.active === c.entityId
    );
    let action: SwitchActiveAction | null = null;
    if (idx !== -1) {
      action = props.availableActions[idx] as SwitchActiveAction;
    }
    const cost = action?.cost ?? [];
    return {
      ...c,
      cost: toCostMap(cost),
      actionIndex: idx,
    };
  });
});

const hands = computed<
  Array<CardData & WithAction & { tuneActionIndex: number }>
>(() => {
  if (props.data.type === "opp") return [];
  return props.data.hands.map((c) => {
    const idx = props.availableActions.findIndex(
      (a) => a.type === "playCard" && a.card === c.entityId
    );
    let action: PlayCardAction | null = null;
    if (idx !== -1) {
      action = props.availableActions[idx] as PlayCardAction;
    }
    const cost = action?.cost ?? [];
    return {
      ...c,
      cost: toCostMap(cost),
      actionIndex: idx,
      tuneActionIndex: props.availableActions.findIndex(
        (a) => a.type === "elementalTuning" && a.discardedCard === c.entityId
      ),
    };
  });
});

const skills = computed<Array<{ id: number } & WithAction>>(() => {
  // TODO load all skill info from static data.
  return props.availableActions
    .map((a, i) => [a, i] as const)
    .filter((ai): ai is [UseSkillAction, number] => {
      return ai[0].type === "useSkill";
    })
    .map(([a, i]) => {
      const cost = a.cost ?? [];
      return {
        id: a.skill,
        cost: toCostMap(cost),
        actionIndex: i,
      };
    });
});

const declareEndIdx = computed<number>(() => {
  return props.availableActions.findIndex((a) => a.type === "declareEnd");
});

function emitClick(idx: number) {
  if (idx !== -1) {
    emit("click", idx);
  }
}

function toCostMap(cost: number[]): [DiceType, number][] {
  const costMap = new Map<DiceType, number>();
  for (const c of cost ?? []) {
    costMap.set(c, (costMap.get(c) ?? 0) + 1);
  }
  if (costMap.size === 0) return [[DiceType.Same, 0]];
  return [...costMap.entries()];
}
</script>

<template>
  <div
    class="flex border border-black gap-1 relative"
    :class="data.type === 'opp' ? 'flex-col-reverse' : 'flex-col'"
  >
    <div class="flex flex-row">
      <div class="bg-yellow-800 text-white p-2">{{ data.pileNumber }}</div>
      <div class="bg-blue-50">SUPPORTS</div>
      <div class="bg-white flex-grow flex justify-center gap-4 p-6">
        <div
          v-for="ch of characters"
          :class="
            data.active === ch.entityId
              ? data.type === 'opp'
                ? 'translate-y-6'
                : '-translate-y-6'
              : ''
          "
        >
          <div
            class="w-20 h-30 relative"
            :class="{ clickable: ch.actionIndex !== -1 }"
            @click="emitClick(ch.actionIndex)"
          >
            <div class="absolute bg-white">{{ ch.health }}</div>
            <div class="absolute right-0 bg-yellow-500">{{ ch.energy }}</div>
            <img :src="(images as any)[ch.id]" />
          </div>
        </div>
      </div>
      <div class="bg-red-50">SUMMONS</div>
      <div class="bg-yellow-800 text-white flex flex-col p-2 gap-2">
        <div v-if="data.type === 'my'">
          <div v-for="d of data.dice">
            <Dice :type="d"></Dice>
          </div>
        </div>
        <div v-else>
          {{ data.dice }}
        </div>
      </div>
    </div>
    <div v-if="data.type === 'my'" class="flex justify-between">
      <div class="flex flex-wrap gap-3">
        <div v-for="hand of hands">
          <div
            class="w-12 flex flex-col"
            @click="emitClick(hand.actionIndex)"
            :class="{ clickable: hand.actionIndex !== -1 }"
          >
            <HandCard :objectId="hand.id" :cost="hand.cost"></HandCard>
          </div>
          <button
            v-if="hand.tuneActionIndex !== -1"
            class="text-green-400 font-bold"
            @click="emitClick(hand.tuneActionIndex)"
          >
            Tune
          </button>
        </div>
      </div>
      <div>
        <ul v-if="availableActions" class="flex gap-2">
          <li
            v-for="skill of skills"
            :class="{ clickable: skill.actionIndex !== -1 }"
            @click="emitClick(skill.actionIndex)"
          >
            {{ skill.id }}
            <div class="flex flex-row">
              <Dice
                v-for="[t, a] of skill.cost"
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
      v-if="declareEndIdx !== -1"
      class="absolute left-3 bg-yellow-300 clickable"
      :class="data.type === 'opp' ? 'bottom-3' : 'top-3'"
    >
      <button @click="emitClick(declareEndIdx)">End round</button>
    </div>
  </div>
</template>

<style>
.clickable {
  cursor: pointer;
  outline: 4px solid lightgreen;
}
</style>
