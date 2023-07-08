<script lang="ts" setup>
import { DiceType } from "@gi-tcg/typings";
import Dice from "./Dice.vue";
import { ref } from "vue";

const props = defineProps<{
  dice: number[];
}>();

const rand = Math.random();

const removed = ref<number[]>([]);

const emit = defineEmits<{
  (e: "selected", selected: number[]): void;
}>();

function selected() {
  emit(
    "selected",
    removed.value.map((i) => props.dice[i])
  );
}
</script>

<template>
  <div class="flex flex-col justify-center items-center">
    <ul class="max-w-[20em] grid grid-cols-4 gap-8">
      <li v-for="(d, i) of dice">
        <input
          type="checkbox"
          hidden
          :value="i"
          :id="`rdInput${rand}-${i}`"
          v-model="removed"
        />
        <label :for="`rdInput${rand}-${i}`">
          <Dice :type="(d as DiceType)" :selected="removed.includes(i)" selectedColor="yellow"  class="scale-150"></Dice>
        </label>
      </li>
    </ul>
    <button class="mt-6 btn btn-primary" @click="selected">Sounds good</button>
  </div>
</template>
