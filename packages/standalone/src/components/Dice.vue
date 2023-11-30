<script lang="ts" setup>
import { DiceType } from '@gi-tcg/typings';


const props = defineProps<{
  value: DiceType
}>();

</script>

<template>
  <div class="w-4 h-4 rounded-2 bg-gray-200">{{ value }}</div>
</template>
