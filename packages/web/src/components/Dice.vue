<script lang="ts" setup>
import { DiceType } from '@jenshin-tcg/typings';

const COLOR: Record<DiceType, string> = {
  [DiceType.VOID   ]: "#222222",
  [DiceType.ANEMO  ]: "#33ccb3",
  [DiceType.GEO    ]: "#cfa726",
  [DiceType.ELECTRO]: "#d376f0",
  [DiceType.DENDRO ]: "#7bb42d",
  [DiceType.HYDRO  ]: "#1c72fd",
  [DiceType.PYRO   ]: "#e2311d",
  [DiceType.CRYO   ]: "#98c8e8",
  [DiceType.OMNI   ]: "#aaaaaa",
  [DiceType.ENERGY ]: "#f0f0f0",
}

const NAME: Record<DiceType, string> = {
  [DiceType.VOID   ]: "任",
  [DiceType.ANEMO  ]: "风",
  [DiceType.GEO    ]: "岩",
  [DiceType.ELECTRO]: "雷",
  [DiceType.DENDRO ]: "草",
  [DiceType.HYDRO  ]: "水",
  [DiceType.PYRO   ]: "火",
  [DiceType.CRYO   ]: "冰",
  [DiceType.OMNI   ]: "万",
  [DiceType.ENERGY ]: "",
}

const { type } = defineProps<{
  type: DiceType;
}>();

</script>
<template>
  <div class="h-6 w-6 text-white text-center" :style="{ backgroundColor: COLOR[type] }">
    {{ NAME[type] }}
  </div>
</template>
