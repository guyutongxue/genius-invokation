<script lang="ts" setup>
import { computed } from "vue";
import Image from "./Image.vue";
import { costData } from "../static_data";
import Dice from "./Dice.vue";

const props = defineProps<{
  id: number;
  enabled: boolean;
}>();

const cardCost = computed(() => costData[props.id]);
</script>

<template>
  <div class="flex flex-col items-center">
    <button
      type="button"
      class="w-10 h-10 rounded-999 bg-yellow-800 p-1 border-none disabled:opacity-50 hover:bg-yellow-700 active:bg-yellow-900 transition-all disabled:bg-yellow-700"
      :disabled="!enabled"
    >
      <Image :id="id" class="object-contain"></Image>
    </button>
    <div class="flex flex-row">
      <Dice
        v-for="[dt, val] of cardCost"
        :value="dt"
        :text="`${val}`"
      ></Dice>
    </div>
  </div>
</template>
