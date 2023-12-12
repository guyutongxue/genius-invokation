<script lang="ts" setup>
import Image from "./Image.vue";

const props = defineProps<{
  id: number;
  enabled: boolean;
}>();
</script>

<template>
  <button
    type="button"
    class="w-10 h-10 rounded-999 bg-yellow-800 p-1 border-none disabled:opacity-50 hover:bg-yellow-700 active:bg-yellow-900 transition-all disabled:bg-yellow-700"
    :disabled="!enabled"
  >
    <Image :id="id" class="object-contain"></Image>
  </button>
</template>
