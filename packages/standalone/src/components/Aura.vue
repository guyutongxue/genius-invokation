<script lang="ts" setup>
import { Aura } from "@gi-tcg/typings";
import { computed } from "vue";

const props = defineProps<{
  applied: Aura;
}>();

const auraList = computed<string[]>(() => {
  switch (props.applied) {
    case Aura.None:
      return [];
    case Aura.Cryo:
      return ["UI_Gcg_Buff_Common_Element_Ice.png"];
    case Aura.Electro:
      return ["UI_Gcg_Buff_Common_Element_Electric.png"];
    case Aura.Hydro:
      return ["UI_Gcg_Buff_Common_Element_Water.png"];
    case Aura.Pyro:
      return ["UI_Gcg_Buff_Common_Element_Fire.png"];
    case Aura.Dendro:
      return ["UI_Gcg_Buff_Common_Element_Grass.png"];
    case Aura.CryoDendro:
      return [
        "UI_Gcg_Buff_Common_Element_Ice.png",
        "UI_Gcg_Buff_Common_Element_Grass.png",
      ];
  }
});
</script>

<template>
  <div class="flex flex-row gap-1 h-6">
    <img
      v-for="icon in auraList"
      :src="'https://guyutongxue.site/gcg-buff-icon-data/Sprite/' + icon"
      class="w-5 h-5"
    />
  </div>
</template>
