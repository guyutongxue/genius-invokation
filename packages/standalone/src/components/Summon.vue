<script lang="ts" setup>
import { EntityData } from '@gi-tcg/typings';
import Image from './Image.vue';

const props = defineProps<{
  data: EntityData;
  outlined: boolean;
  selected: boolean;
}>();

</script>

<template>
  <div class="relative h-15 w-15">
    <Image :id="data.definitionId" class="h-full w-full object-cover"></Image>
    <div class="absolute right-0 top-0"> {{ Object.values(data.variables).join() }} </div>
  </div>
</template>
