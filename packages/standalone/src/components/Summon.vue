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
      class="h-full w-full object-cover rounded"
      :class="{ clickable }"
      @click="clickable && emit('click', data.id)"
    ></Image>
    <div v-if="data.variable !== null"
      class="absolute right-0 top-0 bg-white b-1 b-solid b-black w-6 h-6 rounded-3 translate-x-[50%] translate-y-[-50%] flex justify-center items-center">
      {{ data.variable }}
    </div>
  </div>
</template>
