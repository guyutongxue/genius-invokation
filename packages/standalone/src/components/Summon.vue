<script lang="ts" setup>
import { EntityData } from "@gi-tcg/typings";
import Image from "./Image.vue";

const props = defineProps<{
  data: EntityData;
  clickable: boolean;
  selected: boolean;
}>();

const emit = defineEmits<{
  click: [id: number];
}>();
</script>

<template>
  <div class="relative h-15 w-15" :class="{ selected }">
    <Image
      :id="data.definitionId"
      class="h-full w-full object-cover rounded"
      :class="{ clickable }"
      @click="clickable && emit('click', data.id)"
    ></Image>
    <div
      v-if="data.variable !== null"
      class="absolute right-0 top-0 bg-white b-1 b-solid b-black w-6 h-6 rounded-3 translate-x-[50%] translate-y-[-50%] flex justify-center items-center"
    >
      {{ data.variable }}
    </div>
    <div v-if="data.hintText !== null" class="absolute left-0 bottom-0 gradient-bg">
      <Image
        v-if="data.hintIcon !== null"
        :id="data.hintIcon"
        class="h-5 w-5"
      ></Image>
      <span>{{ data.hintText }}</span>
    </div>
  </div>
</template>

<style scoped>
.gradient-bg {
  background: radial-gradient(
    circle,
    rgba(255, 255, 255, 1) 0%,
    rgba(255, 255, 255, 0) 100%
  );
}
</style>
