<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps<{
  hands: number[];
}>();

const removed = ref<number[]>([]);

const emit = defineEmits<{
  (e: "selected", selected: number[]): void;
}>();
</script>

<template>
  <div>
    <ul>
      <li v-for="(hand, i) of props.hands" :key="hand">
        <input type="checkbox" :value="hand" v-model="removed" />{{ hand }}
      </li>
    </ul>
    <button @click="emit('selected', removed)">Sounds good</button>
  </div>
</template>
