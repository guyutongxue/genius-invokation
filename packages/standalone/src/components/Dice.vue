<script lang="ts" setup>
import { DiceType } from "@gi-tcg/typings";

const COLOR: Record<DiceType, string> = {
  [DiceType.Void]: "#222222",
  [DiceType.Anemo]: "#33ccb3",
  [DiceType.Geo]: "#cfa726",
  [DiceType.Electro]: "#d376f0",
  [DiceType.Dendro]: "#7bb42d",
  [DiceType.Hydro]: "#1c72fd",
  [DiceType.Pyro]: "#e2311d",
  [DiceType.Cryo]: "#98c8e8",
  [DiceType.Omni]: "#ddddaa",
  [DiceType.Energy]: "#eab308",
};

const NAME: Record<DiceType, string> = {
  [DiceType.Void]: "无",
  [DiceType.Anemo]: "风",
  [DiceType.Geo]: "岩",
  [DiceType.Electro]: "雷",
  [DiceType.Dendro]: "草",
  [DiceType.Hydro]: "水",
  [DiceType.Pyro]: "火",
  [DiceType.Cryo]: "冰",
  [DiceType.Omni]: "万",
  [DiceType.Energy]: "充",
};

const props = defineProps<{
  type: DiceType;
  text?: string;
  selected?: boolean;
  selectedColor?: string;
}>();
</script>
<template>
  <div class="relative h-9 overflow-hidden select-none">
    <div
      class="text-5xl text-center align-baseline"
      :class="type === DiceType.Energy ? '-translate-y-2' : '-translate-y-3'"
      :style="{
        color: COLOR[type],
        ...(selected
          ? { '-webkit-text-stroke': '3px ' + (selectedColor ?? 'black') }
          : {}),
      }"
    >
      {{ type === DiceType.Energy ? "\u2726" : "\u2b22" }}
    </div>
    <div
      class="absolute top-0 text-base w-full text-center translate-y-1"
      :class="
        [DiceType.Omni, DiceType.Energy].includes(type)
          ? 'text-black'
          : 'text-white'
      "
    >
      {{ text ?? NAME[type] }}
    </div>
  </div>
</template>
