<script lang="ts" setup>
import { computed } from "vue";
import images from "../assets/images.json";
import icons from "../assets/icons.json";

const props = defineProps<{
  type: "card" | "icon";
  id: number | null;
  width?: number;
  height?: number;
}>();

const imageLink = computed<string>(() =>
  props.id === null
    ? "https://placehold.co/420x720?text=None"
    : (images as any)[props.id],
);
const iconLink = computed<string>(() =>
  props.id === null
    ? "https://placehold.co/100x100"
    : "https://guyutongxue.site/gcg-buff-icon-data/Sprite/" + (icons as any)[props.id],
);

</script>

<template>
  <img v-if="type === 'card'" :src="imageLink" :style="{ width: `${width}px`, height: `${height}px` }" />
  <img v-else-if="id !== null" :src="iconLink" :style="{ width: `${width}px`, height: `${height}px` }" />
</template>
