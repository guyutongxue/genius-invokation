<script lang="ts" setup>
import { ref } from "vue";
import HandCard from "./HandCard.vue";
import { CardData } from "@gi-tcg/typings";

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
      <li v-for="hand of props.hands" :key="hand.entityId">
        <input
          type="checkbox"
          hidden
          :value="hand"
          v-model="removed"
          :id="`shInput${rand}-${hand}`"
        />
        <label class="relative" :for="`shInput${rand}-${hand}`">
          <HandCard class="w-20" :objectId="Math.floor(hand)"></HandCard>
          <div
            v-if="removed.includes(hand)"
            class="absolute top-[50%] left-0 w-full text-center text-7xl font-bold text-red-600 translate-y-[-50%]"
          >
            &#8856;
          </div>
        </label>
      </li>
    </ul>
    <button class="mt-3 btn btn-primary" @click="emit('selected', removed)">
      Sounds good
    </button>
  </div>
</template>
