<script lang="ts" setup>
import { CharacterData } from "@gi-tcg/typings";
import Image from "./Image.vue";

const props = defineProps<{
  data: CharacterData;
}>();
</script>

<template>
  <div>
    <div class="m-2 h-40 w-30 bg-yellow">
      <ul class="list-none p-0">
        <li>id = {{ data.id }}</li>
        <li>defId = {{ data.definitionId }}</li>
        <li>health = {{ data.health }}</li>
        <li>energy = {{ data.energy }}</li>
        <Image :id="data.definitionId" class="h-20"></Image>
      </ul>
    </div>
  </div>
</template>
