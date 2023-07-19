<script lang="ts" setup>
import {
  Action,
  CardData,
  CharacterData,
  DiceType,
  PlayCardAction,
  SummonData,
  SwitchActiveAction,
  UseSkillAction,
} from "@gi-tcg/typings";
import images from "../assets/images.json";
import Dice from "./Dice.vue";
import Character from "./Character.vue";
import HandCard from "./HandCard.vue";
import { computed } from "vue";
import { MyPlayerData, OppPlayerData } from "@gi-tcg/typings";
import Aura from "./Aura.vue";

export type Clickable = (
  | {
      type: "entity";
      entityId: number;
      withMark?: boolean;
    }
  | {
      type: "skill";
      id: number;
    }
  | {
      type: "declareEnd";
    }
  | {
      type: "elementalTuning";
      entityId: number;
    }
) & {
  cost?: DiceType[];
};

const props = defineProps<{
  name?: string;
  data: MyPlayerData | OppPlayerData;
  availableActions: Clickable[];
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
      (a) => a.type === "entity" && a.entityId === c.entityId
    );
    let cost: DiceType[] = [];
    if (idx !== -1) {
      cost = props.availableActions[idx].cost ?? [];
    }
    return {
      ...c,
      cost: toCostMap(cost),
      actionIndex: idx,
    };
  });
});

const summons = computed<Array<SummonData & WithAction>>(() => {
  return props.data.summons.map((c) => {
    const idx = props.availableActions.findIndex(
      (a) => a.type === "entity" && a.entityId === c.entityId
    );
    let cost: DiceType[] = [];
    if (idx !== -1) {
      cost = props.availableActions[idx].cost ?? [];
    }
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
      (a) => a.type === "entity" && a.entityId === c.entityId
    );
    let cost: DiceType[] = [];
    if (idx !== -1) {
      cost = props.availableActions[idx].cost ?? [];
    }
    return {
      ...c,
      cost: toCostMap(cost),
      actionIndex: idx,
      tuneActionIndex: props.availableActions.findIndex(
        (a) => a.type === "elementalTuning" && a.entityId === c.entityId
      ),
    };
  });
});

const skills = computed<Array<{ id: number } & WithAction>>(() => {
  // TODO load all skill info from static data.
  return props.availableActions.flatMap((a, i) => {
    const cost = a.cost ?? [];
    if (a.type !== "skill") return [];
    return [
      {
        id: a.id,
        cost: toCostMap(cost),
        actionIndex: i,
      },
    ];
  });
});

const declareEndIdx = computed<number>(() => {
  return props.availableActions.findIndex((a) => a.type === "declareEnd");
});

function showMark(actionIdx: number): boolean {
  if (actionIdx === -1) return false;
  const action = props.availableActions[actionIdx];
  if (action.type !== "entity") return false;
  return action.withMark ?? false;
}

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
  <div class="flex gap-1 relative flex-col">
    <div class="flex flex-row">
      <div
        class="bg-yellow-800 text-white p-1 flex justify-between"
        :class="data.type === 'my' ? 'flex-col-reverse' : 'flex-col'"
      >
        <div>
          {{ data.pileNumber }}
        </div>
        <div v-if="data.type === 'opp'">
          <Dice :type="DiceType.Void" :text="String(data.dice)"></Dice>
        </div>
      </div>
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
          <div class="flex flex-col items-center">
            <Aura :applied="ch.applied"></Aura>
            <div
              class="relative"
              :class="{ clickable: ch.actionIndex !== -1 }"
              @click="emitClick(ch.actionIndex)"
            >
              <Character :character="ch"></Character>
              <span v-if="showMark(ch.actionIndex)" class="check-mark"> </span>
            </div>
          </div>
        </div>
      </div>
      <div class="bg-red-50">
        SUMMONS
        <div
          v-for="summon of summons"
          class="grid grid-cols-2 grid-rows-2 gap-4"
        >
          <div
            class="w-10 h-14 relative"
            :class="{ clickable: summon.actionIndex !== -1 }"
            @click="emitClick(summon.actionIndex)"
          >
            <div class="absolute bg-white">{{ summon.value }}</div>
            <img :src="(images as any)[summon.id]" />
            <span v-if="showMark(summon.actionIndex)" class="check-mark">
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-if="data.type === 'my'" class="flex justify-between items-end">
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
        <ul v-if="availableActions" class="m-4 flex gap-2">
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
              ></Dice>
            </div>
          </li>
        </ul>
      </div>
    </div>
    <div
      v-if="data.type === 'my' && declareEndIdx !== -1"
      class="absolute left-3 top-3 bg-yellow-300 clickable"
    >
      <button @click="emitClick(declareEndIdx)">End round</button>
    </div>
  </div>
</template>

<style scoped>
.clickable {
  cursor: pointer;
  outline: 4px solid lightgreen;
}
.check-mark {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  text-align: center;
  font-size: 3.5rem;
  font-weight: bold;
  color: green;
  transform: translateY(-50%);
}
.check-mark::before {
  content: "\2705";
}
</style>
