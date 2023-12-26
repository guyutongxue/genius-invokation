<script lang="ts" setup>
import { EntityData } from "@gi-tcg/typings";
import Image from "./Image.vue";

const props = defineProps<{
  data: EntityData;
}>();

</script>

<template>
  <div class="relative w-5">
    <Image :id="data.definitionId" class="h-5"></Image>
    <div
      v-if="data.variable !== null"
      class="absolute right-0 bottom-0 text-xs"
    >
      {{ data.variable }}
    </div>
  </div>
</template>
