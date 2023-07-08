<script lang="ts" setup>
import { DiceType } from "@jenshin-tcg/typings";
import images from "../assets/images.json";
import Dice from "./Dice.vue";

defineProps<{
  objectId: number;
  cost?: [DiceType, number][];
}>();
</script>

<template>
  <div class="relative">
    <img :src="(images as any)[objectId]" />
    <div class="absolute left-0 top-0 -translate-x-4 -translate-y-4 scale-75">
      <Dice v-for="d of cost ?? []" :type="d[0]" :text="String(d[1])"></Dice>
    </div>
  </div>
</template>
