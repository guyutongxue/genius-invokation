<script lang="ts" setup>
import { CharacterData } from "@gi-tcg/typings";
import Status from "./Status.vue";
import Image from "./Image.vue";

const props = defineProps<{
  character: CharacterData;
}>();
</script>

<template>
  <div class="relative w-20 h-30">
    <div class="absolute left-0 top-0 bg-white">{{ character.health }}</div>
    <div class="absolute left-0 top-6 -mx-4">
      <ul class="flex flex-col gap-2">
        <li v-if="character.weapon">
          <Image type="icon" :id="-1" class="w-8"></Image>
        </li>
        <li v-if="character.artifact">
          <Image type="icon" :id="-2" class="w-8"></Image>
        </li>
        <li
          v-for="item of character.equipments.filter(
            (e) => e !== character.weapon && e !== character.artifact,
          )"
        >
          <Image type="icon" :id="-3" class="w-8"></Image>
        </li>
      </ul>
    </div>
    <div class="absolute right-0 top-0 bg-yellow-500">
      {{ character.energy }}
    </div>
    <Image type="card" :id="character.id" :class="{ 'brightness-50': character.defeated }" />
    <div class="absolute bottom-0 flex flex-row gap-1 p-1">
      <Status v-for="st of character.statuses" :status="st"></Status>
    </div>
    <div
      v-if="character.defeated"
      class="absolute top-[50%] left-0 w-full text-center text-5xl font-bold text-red-600 translate-y-[-50%]"
    >
      &#9760;
    </div>
  </div>
</template>
