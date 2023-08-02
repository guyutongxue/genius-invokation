<script lang="ts" setup>
import { DiceType } from "@gi-tcg/typings";
import Dice from "./Dice.vue";
import Image from "./Image.vue";

defineProps<{
  objectId: number;
  cost?: [DiceType, number][];
}>();
</script>

<template>
  <div class="relative">
    <Image type="card" :id="objectId" />
    <div class="absolute left-0 top-0 -translate-x-2 -translate-y-2">
      <Dice v-for="d of cost ?? []" :type="d[0]" :text="String(d[1])"></Dice>
    </div>
  </div>
</template>
