<script lang="ts" setup>
import { EntityData } from "@gi-tcg/typings";

const props = defineProps<{
  data: EntityData;
  outlined: boolean;
  selected: boolean;
}>();

const emit = defineEmits<{
  click: [id: number];
}>();
</script>

<template>
  <div class="relative h-15 w-15">
    <Image :id="data.definitionId" class="h-full w-full object-cover"></Image>
    <div class="absolute right-0 top-0">
      {{ Object.values(data.variables).join() }}
    </div>
  </div>
</template>
