<script lang="ts" setup>
import images from "../assets/images.json";

defineProps<{
  objectId: number
}>();

</script>

<template>
  <img :src="(images as any)[objectId]">
</template>
