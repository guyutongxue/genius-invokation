<script lang="ts" setup>
import { DiceType } from "@jenshin-tcg/typings";

const COLOR: Record<DiceType, string> = {
  [DiceType.VOID]: "#222222",
  [DiceType.ANEMO]: "#33ccb3",
  [DiceType.GEO]: "#cfa726",
  [DiceType.ELECTRO]: "#d376f0",
  [DiceType.DENDRO]: "#7bb42d",
  [DiceType.HYDRO]: "#1c72fd",
  [DiceType.PYRO]: "#e2311d",
  [DiceType.CRYO]: "#98c8e8",
  [DiceType.OMNI]: "#aaaaaa",
  [DiceType.ENERGY]: "#f0f0f0",
};

const NAME: Record<DiceType, string> = {
  [DiceType.VOID]: "无",
  [DiceType.ANEMO]: "风",
  [DiceType.GEO]: "岩",
  [DiceType.ELECTRO]: "雷",
  [DiceType.DENDRO]: "草",
  [DiceType.HYDRO]: "水",
  [DiceType.PYRO]: "火",
  [DiceType.CRYO]: "冰",
  [DiceType.OMNI]: "万",
  [DiceType.ENERGY]: "充",
};

const props = defineProps<{
  type: DiceType;
  selected?: boolean;
  selectedColor?: string;
}>();
</script>
<template>
  <div class="relative h-9 overflow-hidden select-none">
    <div
      class="text-5xl text-center align-baseline -translate-y-3"
      :style="{
        color: COLOR[type],
        ...(selected
          ? { '-webkit-text-stroke': '3px ' + (selectedColor ?? 'black') }
          : {}),
      }"
    >
      &#11042;
    </div>
    <div
      class="absolute top-0 text-base w-full text-center text-white translate-y-1"
    >
      {{ NAME[type] }}
    </div>
  </div>
</template>
