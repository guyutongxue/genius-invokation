<script lang="ts" setup>
import { EntityData } from "@gi-tcg/typings";
import { visibleVarData } from "../static_data";
import Image from "./Image.vue";

const props = defineProps<{
  data: EntityData;
}>();
</script>

<template>
  <div class="relative w-5">
    <Image :id="data.definitionId" class="h-5"></Image>
    <div
      class="absolute right-0 bottom-0 text-xs"
      v-if="visibleVarData[data.definitionId]"
    >
      {{ data.variables[visibleVarData[data.definitionId]!] }}
    </div>
  </div>
</template>
