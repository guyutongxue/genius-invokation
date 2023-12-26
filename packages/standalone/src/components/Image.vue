<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { requestLoad } from "../images";

const prop = defineProps<{
  id: number;
  width?: number;
}>();

const dataUrl = computed(() => requestLoad(prop.id));

</script>

<template>
  <img v-if="dataUrl" :src="dataUrl.value" :width="width" draggable="false">
  <div v-else :style="{ width }">?</div>
</template>
