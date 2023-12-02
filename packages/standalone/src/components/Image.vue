<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { requestLoad } from "../images";

const prop = defineProps<{
  id: number;
  width?: number;
}>();

const dataUrl = requestLoad(prop.id);

</script>

<template>
  <img v-if="dataUrl" :src="dataUrl" :width="width">
  <div v-else :style="{ width }">?</div>
</template>
