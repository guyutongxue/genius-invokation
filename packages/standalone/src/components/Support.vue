<script lang="ts" setup>
import { EntityData } from "@gi-tcg/typings";
import Image from "./Image.vue";

const props = defineProps<{
  data: EntityData;
  clickable: boolean;
  selected: boolean;
}>();

const emit = defineEmits<{
  click: [id: number];
}>();
</script>

<template>
  <div class="relative h-15 w-15" :class="{ selected }">
    <Image
      :id="data.definitionId"
      class="h-full w-full object-cover"
      :class="{ clickable }"
      @click="clickable && emit('click', data.id)"
    ></Image>
    <div class="absolute right-0 top-0">
      {{ Object.values(data.variables).join() }}
    </div>
  </div>
</template>
