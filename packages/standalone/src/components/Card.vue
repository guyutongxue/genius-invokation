<script lang="ts" setup>
import { CardData } from "@gi-tcg/typings";
import Image from "./Image.vue";

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
      class="card"
      v-if="data.definitionId > 0"
      :class="{ selected }"
      @click="clickable && emit('click', data.id)"
      @dragstart="dragstartHandler"
      @dragend="dragendHandler"
      :draggable="draggable"
    >
      <Image
        :id="data.definitionId"
        class="h-full rounded"
        :class="{ clickable }"
        :title="`id = ${data.id}`"
      ></Image>
    </div>
    <div
      v-else
      class="h-full aspect-[7/12] rotated flex items-center justify-center bg-gray-600 border-gray-700 border-solid border-4 color-white rounded"
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
