<script lang="ts" setup>
import { DiceType } from "@jenshin-tcg/typings";
import { computed, ref } from "vue";
import Dice from "./Dice.vue";

const props = defineProps<{
  dice: DiceType[];
  required: DiceType[];
}>();
const rand = Math.random();

function initChosen() {
  const requiredMap = new Map<DiceType, number>();
  for (const r of props.required) {
    requiredMap.set(r, (requiredMap.get(r) ?? 0) + 1);
  }
  const OMNI_COUNT = props.dice.filter((d) => d === DiceType.OMNI).length;
  if (requiredMap.has(DiceType.OMNI)) {
    const requiredCount = requiredMap.get(DiceType.OMNI)!;
    for (let i = props.dice.length - 1; i >= 0; i--) {
      const thisCount = requiredMap.get(props.dice[i]) ?? 0;
      if (thisCount + OMNI_COUNT < requiredCount) continue;
      const result: number[] = [];
      for (
        let j = 0;
        result.length < requiredCount && j < props.dice.length;
        j++
      ) {
        if (j === DiceType.OMNI || j === props.dice[i]) result.push(j);
      }
      return result;
    }
    return [];
  }
  const result: number[] = [];
  next: for (const r of props.required) {
    if (r === DiceType.VOID) {
      for (let j = props.dice.length - 1; j >= 0; j--) {
        if (!result.includes(j)) {
          result.push(j);
          continue next;
        }
      }
    } else {
      for (let j = 0; j < props.dice.length; j++) {
        if (!result.includes(j) && props.dice[j] === r) {
          result.push(j);
          continue next;
        }
      }
      for (let j = 0; j < props.dice.length; j++) {
        if (!result.includes(j) && props.dice[j] === DiceType.OMNI) {
          result.push(j);
          continue next;
        }
      }
    }
    return [];
  }
  return result;
}

const isOk = computed<boolean>(() => {
  const requiredMap = new Map<DiceType, number>();
  for (const r of props.required) {
    requiredMap.set(r, (requiredMap.get(r) ?? 0) + 1);
  }
  if (requiredMap.has(DiceType.OMNI)) {
    const requiredCount = requiredMap.get(DiceType.OMNI)!;
    if (requiredCount !== chosen.value.length) return false;
    const chosenMap = new Set<DiceType>(chosen.value.map((i) => props.dice[i]));
    return (
      chosenMap.size === 1 ||
      (chosenMap.size === 2 && chosenMap.has(DiceType.OMNI))
    );
  }
  const chosen2 = [...chosen.value];
  let voidCount = 0;
  for (const r of props.required) {
    if (r === DiceType.VOID) {
      voidCount++;
      continue;
    }
    const index = chosen2.findIndex((i) => props.dice[i] === r);
    if (index === -1) {
      const omniIndex = chosen2.findIndex((i) => props.dice[i] === DiceType.OMNI);
      if (omniIndex === -1) return false;
      chosen2.splice(omniIndex, 1);
      continue;
    }
    chosen2.splice(index, 1);
  }
  return chosen2.length === voidCount;
});

const chosen = ref<number[]>(initChosen());

const emit = defineEmits<{
  (e: "selected", selected: number[]): void;
  (e: "cancelled"): void;
}>();
</script>

<template>
  <div class="p-3 flex flex-col justify-between items-center">
    <ul class="grid grid-cols-2 scale-125 origin-top">
      <li v-for="(d, i) of dice">
        <input
          type="checkbox"
          hidden
          :value="i"
          :id="`rdInput${rand}-${i}`"
          v-model="chosen"
        />
        <label :for="`rdInput${rand}-${i}`">
          <Dice :type="(d as DiceType)" :selected="chosen.includes(i)"></Dice>
        </label>
      </li>
    </ul>
    <div>
      <button
        class="btn btn-primary"
        :disabled="!isOk"
        @click="$emit('selected', chosen)"
      >
        Go
      </button>
      <button
        class="btn"
        @click="$emit('cancelled')"
      >
        Cancel
      </button>
    </div>
  </div>
</template>
