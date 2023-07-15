<script lang="ts" setup>
import { DiceType, PlayCardTargets } from "@gi-tcg/typings";
import { checkDice, chooseDice } from "@gi-tcg/utils";
import { computed, ref } from "vue";
import Dice from "./Dice.vue";
import SelectTarget from "./SelectTarget.vue";

const props = defineProps<{
  dice: DiceType[];
  required: DiceType[];
  targets?: PlayCardTargets;
}>();
const rand = Math.random();

const isOk = computed<boolean>(() =>
  checkDice(props.required, props.dice, chosen.value)
);

const chosen = ref<number[]>(chooseDice(props.required, props.dice));

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
          v-model="chosen"
        />
        <label :for="`rdInput${rand}-${i}`">
          <Dice
            :type="(d as DiceType)"
            :selected="chosen.includes(i)"
            :size="40"
          ></Dice>
        </label>
      </li>
    </ul>
    <div class="flex flex-col gap-1">
      <button
        class="btn btn-primary"
        :disabled="!isOk"
        @click="$emit('selected', chosen)"
      >
        确认
      </button>
      <button class="btn" @click="$emit('cancelled')">取消</button>
    </div>
  </div>
</template>
