<script lang="ts" setup>
import { Deck } from "./Casket.vue";
import Image from "./Image.vue";
const props = defineProps<{
  deck: Deck
}>()
</script>

<template>
  <ul class="relative flex flex-row items-end justify-center pt-16 px-10">
    <li class="p-1 bg-white z-20 rounded-lg"><Image type="card" :id="deck.characters[0]" :width="100" /></li>
    <li class="absolute left-0 bottom-10 p-1 z-10 bg-white rounded-lg -rotate-12"><Image type="card" :id="deck.characters[1]" :width="100" /></li>
    <li class="absolute right-0 bottom-14 p-1 bg-white rounded-lg rotate-12"><Image type="card" :id="deck.characters[2]" :width="100" /></li>
  </ul>
</template>
