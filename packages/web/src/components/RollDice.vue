<script lang="ts" setup>
import { DiceType } from "@jenshin-tcg/typings";
import Dice from "./Dice.vue";
import { ref } from "vue";

const { dice } = defineProps<{
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
    removed.value.map((i) => dice[i])
  );
}
</script>

<template>
  <div>
    <ul class="flex gap-2">
      <li v-for="(d, i) of dice">
        <input
          type="checkbox"
          :value="i"
          :id="`rdInput${rand}-${i}`"
          v-model="removed"
        />
        <label :for="`rdInput${rand}-${i}`">
          <Dice :type="(d as DiceType)"></Dice>
        </label>
      </li>
    </ul>
    <button @click="selected">Sounds good</button>
  </div>
</template>
