<script lang="ts" setup>
import { DiceType } from "@jenshin-tcg/typings";
import Dice from "./Dice.vue";
import { ref } from "vue";

const { dice } = defineProps<{
  dice: number[];
}>();

const removed = ref<number[]>([]);

const emit = defineEmits<{
  selected: [selected: number[]];
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
        <input type="checkbox" :value="i" v-model="removed" />
        <Dice :type="(d as DiceType)"></Dice>
      </li>
    </ul>
    <button @click="selected">Sounds good</button>
  </div>
</template>
