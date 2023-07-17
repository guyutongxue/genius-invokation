<script lang="ts" setup>
import { CharacterData } from "@gi-tcg/typings";
import images from "../assets/images.json";
import { computed } from "vue";
import Status from "./Status.vue";

const props = defineProps<{
  character: CharacterData;
}>();

const imageLink = computed<string>(() => (images as any)[props.character.id]);
</script>

<template>
  <div class="relative w-20 h-30">
    <div class="absolute bg-white">{{ character.health }}</div>
    <div class="absolute right-0 bg-yellow-500">{{ character.energy }}</div>
    <img :src="imageLink" />
    <div class="absolute bottom-0 flex flex-row gap-1 p-1">
      <Status v-for="st of character.statuses" :status="st"></Status>
    </div>
  </div>
</template>
