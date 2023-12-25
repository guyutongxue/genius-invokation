<script lang="ts" setup>
import { ref } from "vue";
import { CardData } from "@gi-tcg/typings";
import Card from "./Card.vue";

const props = defineProps<{
  hands: CardData[];
}>();

const removed = ref<number[]>([]);
const rand = Math.random();

const emit = defineEmits<{
  (e: "selected", selected: number[]): void;
}>();

</script>

<template>
  <div class="flex flex-col justify-center items-center">
    <ul class="flex gap-4">
      <li v-for="card of hands" :key="card.id">
        <input
          type="checkbox"
          hidden
          :value="card.id"
          v-model="removed"
          :id="`shInput${rand}-${card.id}`"
        />
        <label class="relative" :for="`shInput${rand}-${card.id}`">
          <Card class="w-20" :data="card"></Card>
          <div
            v-if="removed.includes(card.id)"
            class="absolute top-[50%] left-0 w-full text-center text-7xl font-bold text-red-600 translate-y-[-50%]"
          >
            &#8856;
          </div>
        </label>
      </li>
    </ul>
    <button class="mt-3 btn btn-green" @click="$emit('selected', removed)">
      确定
    </button>
  </div>
</template>
