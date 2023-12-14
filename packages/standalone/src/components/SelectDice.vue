<script lang="ts" setup>
import { DiceType } from "@gi-tcg/typings";
import { checkDice, chooseDice } from "@gi-tcg/utils";
import { computed, ref } from "vue";
import Dice from "./Dice.vue";

const props = defineProps<{
  dice: DiceType[];
  required: DiceType[];
  disableOk?: boolean;
  disableOmni?: boolean;
  disableCancel?: boolean;
}>();
const rand = Math.random();

const isOk = computed<boolean>(
  () =>
    (!props.disableOmni || !chosenDice.value.includes(DiceType.Omni)) &&
    checkDice(props.required, chosenDice.value),
);

const chosenIdx = ref<number[]>(chooseDice(props.required, props.dice));
const chosenDice = computed(() => chosenIdx.value.map((i) => props.dice[i]));

const emit = defineEmits<{
  (e: "selected", selected: number[]): void;
  (e: "cancelled"): void;
}>();
</script>

<template>
  <div class="p-3 flex flex-col justify-between items-center">
    <ul class="grid grid-cols-2">
      <li v-for="(d, i) of dice">
        <input
          type="checkbox"
          hidden
          :value="i"
          :id="`rdInput${rand}-${i}`"
          v-model="chosenIdx"
        />
        <label :for="`rdInput${rand}-${i}`">
          <Dice :value="d" :selected="chosenIdx.includes(i)" :size="40"></Dice>
        </label>
      </li>
    </ul>
    <div class="flex flex-col gap-1">
      <button
        class="btn btn-yellow text-black"
        :disabled="disableOk || !isOk"
        @click="$emit('selected', chosenDice)"
      >
        确认
      </button>
      <button
        v-if="!disableCancel"
        class="btn btn-red"
        @click="$emit('cancelled')"
      >
        取消
      </button>
    </div>
  </div>
</template>
