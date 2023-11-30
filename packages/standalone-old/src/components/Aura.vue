<script lang="ts" setup>
import { Aura } from "@gi-tcg/typings";
import { computed } from "vue";
import Image from "./Image.vue";

const props = defineProps<{
  applied: Aura;
}>();

const auraList = computed<number[]>(() => {
  switch (props.applied) {
    case Aura.None:
      return [];
    case Aura.Cryo:
      return [1];
    case Aura.Electro:
      return [4];
    case Aura.Hydro:
      return [2];
    case Aura.Pyro:
      return [3];
    case Aura.Dendro:
      return [7];
    case Aura.CryoDendro:
      return [1, 7];
  }
});
</script>

<template>
  <div class="flex flex-row gap-1 h-6 justify-center">
    <Image v-for="ic in auraList" type="icon" :id="ic" class="w-5 h-5" />
  </div>
</template>
