<script lang="ts" setup>
import { CharacterData } from "@gi-tcg/typings";
import Image from "./Image.vue";
import EnergyBar from "./EnergyBar.vue";
import { maxEnergyData } from "../max_energy";

const props = defineProps<{
  data: CharacterData;
}>();
</script>

<template>
  <div>
    <div class="m-2 h-40 relative" :title="`id=${data.id}`">
      <div class="absolute left-[-15px] top-[-20px] flex items-center justify-center">
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
        class="absolute right-[-10px] top-0"
        :current="data.energy"
        :total="maxEnergyData[data.definitionId]"
      ></EnergyBar>
      <Image :id="data.definitionId" class="h-full"></Image>
    </div>
  </div>
</template>
