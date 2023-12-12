<script lang="ts" setup>
import { CharacterData } from "@gi-tcg/typings";
import Image from "./Image.vue";
import EnergyBar from "./EnergyBar.vue";
import { maxEnergyData } from "../static_data";
import Status from "./Status.vue";

const props = defineProps<{
  data: CharacterData;
  clickable: boolean;
  selected: boolean;
}>();

const emit = defineEmits<{
  click: [id: number];
}>();
</script>

<template>
  <div class="flex flex-col gap-1 items-center">
    <div class="h-5 flex flex-row items-end gap-2">
      <Image v-if="data.aura & 0xf" :id="data.aura & 0xf" class="w-5"></Image>
      <Image
        v-if="(data.aura >> 4) & 0xf"
        :id="(data.aura >> 4) & 0xf"
        class="w-5"
      ></Image>
    </div>
    <div class="h-40 relative" :title="`id=${data.id}`" :class="{ selected }">
      <div
        class="absolute z-10 left-[-15px] top-[-20px] flex items-center justify-center"
      >
        <!-- 水滴 -->
        <svg
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="40"
        >
          <path
            d="M926.2 609.8c0 227.2-187 414.2-414.2 414.2S97.8 837 97.8 609.8c0-226.2 173.3-395 295.7-552C423.5 19.3 467.8 0 512 0s88.5 19.3 118.5 57.8c122.4 157 295.7 325.8 295.7 552z"
            fill="#ffffff"
            stroke="black"
            stroke-width="30"
          ></path>
        </svg>
        <div class="absolute">
          {{ data.health }}
        </div>
      </div>
      <EnergyBar
        class="absolute z-10 right-[-10px] top-0"
        :current="data.energy"
        :total="maxEnergyData[data.definitionId]"
      ></EnergyBar>
      <Image
        :id="data.definitionId"
        class="h-full rounded-lg"
        :class="{ 'brightness-50': data.defeated, clickable }"
        @click="clickable && emit('click', data.id)"
      ></Image>
      <div class="absolute left-0 bottom-0">
        <Status v-for="st of data.entities" :data="st"></Status>
      </div>
      <div
        v-if="data.defeated"
        class="absolute z-10 top-[50%] left-0 w-full text-center text-5xl font-bold translate-y-[-50%] font-[var(--font-emoji)]"
      >
        &#9760;
      </div>
    </div>
  </div>
</template>
