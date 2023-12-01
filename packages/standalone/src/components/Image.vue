<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { requestLoad } from "../images";

const prop = defineProps<{
  id: number;
}>();

const dataUrl = requestLoad(prop.id);

</script>

<template>
  <img v-if="dataUrl" :src="dataUrl">
</template>
