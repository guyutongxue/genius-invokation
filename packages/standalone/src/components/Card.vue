<script lang="ts" setup>
import { CardData } from "@gi-tcg/typings";
import Image from "./Image.vue";

const props = defineProps<{
  data: CardData;
  clickable: boolean;
  selected: boolean;
}>();

const emit = defineEmits<{
  click: [id: number];
}>();
</script>

<template>
  <div class="h-30" :class="{ selected }">
    <Image
      v-if="data.definitionId > 0"
      :id="data.definitionId"
      class="h-full"
      :class="{ clickable }"
      @click="clickable && emit('click', data.id)"
    ></Image>
    <div
      v-else
      class="h-full aspect-[7/12] flex items-center justify-center bg-gray-600 color-white rounded"
    >
      ?
    </div>
  </div>
</template>
