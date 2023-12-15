<script lang="ts" setup>
import { computed } from "vue";
import { CardData } from "@gi-tcg/typings";
import {} from "@gi-tcg/utils";

import Image from "./Image.vue";
import { costData } from "../static_data";
import Dice from "./Dice.vue";

const props = defineProps<{
  data: CardData;
  clickable: boolean;
  draggable: boolean;
  selected: boolean;
}>();

const emit = defineEmits<{
  click: [id: number];
  dragstart: [id: number];
  dragend: [id: number];
}>();

const cardCost = computed(() => costData[props.data.definitionId]);

function dragstartHandler(e: DragEvent) {
  e.dataTransfer!.setData("text/plain", props.data.id.toString());
  emit("dragstart", props.data.id);
}
function dragendHandler(e: DragEvent) {
  emit("dragend", props.data.id);
}
</script>

<template>
  <div class="wrapper">
    <div
      class="card relative"
      v-if="data.definitionId > 0"
      :class="{ selected }"
      @click="clickable && emit('click', data.id)"
      @dragstart="dragstartHandler"
      @dragend="dragendHandler"
      :draggable="draggable"
    >
      <Image
        :id="data.definitionId"
        class="h-full rounded-lg shadow-lg"
        :class="{ clickable }"
        :title="`id = ${data.id}`"
      ></Image>
      <div class="absolute left-0 top-0 translate-x-[-50%] flex flex-col">
        <Dice
          v-for="[dt, val] of cardCost"
          :value="dt"
          :text="`${val}`"
          :size="30"
        ></Dice>
      </div>
    </div>
    <div
      v-else
      class="h-full aspect-[7/12] rotated flex items-center justify-center bg-gray-600 b-gray-700 b-solid b-4 color-white rounded"
    >
      ?
    </div>
  </div>
</template>

<style scoped>
.wrapper {
  height: 100%;
  perspective: 800px;
  aspect-ratio: 1/2;
  transition-property: all;
  transition-duration: 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wrapper:has(.card):hover,
.wrapper:has(.selected) {
  aspect-ratio: 1/1;
}
.wrapper:hover > .card,
.wrapper > .selected {
  transform: none;
  transition: all;
}

.card {
  height: 100%;
  transform: rotate3d(0, 1, 0, 30deg);
  transition: all;
}
.rotated {
  transform: rotate3d(0, 1, 0, 30deg);
}
</style>
