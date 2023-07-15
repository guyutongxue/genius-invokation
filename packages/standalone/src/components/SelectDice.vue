<script lang="ts" setup>
import { DiceType, PlayCardTargets } from "@gi-tcg/typings";
import { computed, ref } from "vue";
import Dice from "./Dice.vue";
import SelectTarget from "./SelectTarget.vue";

const props = defineProps<{
  dice: DiceType[];
  required: DiceType[];
  targets?: PlayCardTargets;
}>();
const rand = Math.random();

function initChosen() {
  const requiredMap = new Map<DiceType, number>();
  for (const r of props.required) {
    if (r === DiceType.Energy) continue;
    requiredMap.set(r, (requiredMap.get(r) ?? 0) + 1);
  }
  const OMNI_COUNT = props.dice.filter((d) => d === DiceType.Omni).length;
  if (requiredMap.has(DiceType.Omni)) {
    const requiredCount = requiredMap.get(DiceType.Omni)!;
    for (let i = props.dice.length - 1; i >= 0; i--) {
      if (props.dice[i] === DiceType.Omni) continue;
      const thisCount = props.dice.filter(d => d === props.dice[i]).length;
      if (thisCount + OMNI_COUNT < requiredCount) continue;
      const result: number[] = [];
      for (
        let j = props.dice.length - 1;
        result.length < requiredCount && j >= 0;
        j--
      ) {
        if (props.dice[j] === DiceType.Omni || props.dice[j] === props.dice[i])
          result.push(j);
      }
      return result;
    }
    return [];
  }
  const result: number[] = [];
  next: for (const r of props.required) {
    if (r === DiceType.Energy) continue;
    if (r === DiceType.Void) {
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
        if (!result.includes(j) && props.dice[j] === DiceType.Omni) {
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
    if (r === DiceType.Energy) continue;
    requiredMap.set(r, (requiredMap.get(r) ?? 0) + 1);
  }
  if (requiredMap.has(DiceType.Omni)) {
    const requiredCount = requiredMap.get(DiceType.Omni)!;
    if (requiredCount !== chosen.value.length) return false;
    const chosenMap = new Set<DiceType>(chosen.value.map((i) => props.dice[i]));
    return (
      chosenMap.size === 1 ||
      (chosenMap.size === 2 && chosenMap.has(DiceType.Omni))
    );
  }
  const chosen2 = [...chosen.value];
  let voidCount = 0;
  for (const r of props.required) {
    if (r === DiceType.Energy) continue;
    if (r === DiceType.Void) {
      voidCount++;
      continue;
    }
    const index = chosen2.findIndex((i) => props.dice[i] === r);
    if (index === -1) {
      const omniIndex = chosen2.findIndex(
        (i) => props.dice[i] === DiceType.Omni
      );
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
  (e: "selected", selected: number[], target?: number): void;
  (e: "cancelled"): void;
}>();
</script>

<template>
  <div>
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
        <button class="btn" @click="$emit('cancelled')">Cancel</button>
      </div>
    </div>
    <div v-if="targets">
      <SelectTarget
        :targets="targets"
      ></SelectTarget>
    </div>
  </div>
</template>
