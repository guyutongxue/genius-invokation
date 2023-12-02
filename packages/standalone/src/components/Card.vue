<script lang="ts" setup>
import { CardData } from '@gi-tcg/typings';
import Image from './Image.vue';

const props = defineProps<{
  data: CardData
}>();

</script>

<template>
  <div class="h-30">
    <Image v-if="data.definitionId > 0" :id="data.definitionId" class="h-full"></Image>
    <div v-else class="h-30 w-17.5 flex items-center justify-center bg-gray-600 color-white rounded">
      ?
    </div>
  </div>
</template>
