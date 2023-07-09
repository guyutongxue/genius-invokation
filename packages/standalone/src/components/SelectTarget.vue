<script lang="ts" setup>
import { PlayCardTargets } from "@gi-tcg/typings";
import images from "../assets/images.json";
import { ref } from "vue";

const props = defineProps<{
  targets: PlayCardTargets;
}>();

const selection = ref<number>(0);

const rand = Math.random();

const emit = defineEmits<{
  (e: "selected", selected: number): void;
}>();
</script>

<template>
  <div>
    <p>选择目标：</p>
    <ul>
      <li v-for="(t, i) of targets.candidates">
        <input
          type="radio"
          :id="`stInput${rand}-${i}`"
          :value="i"
          v-model="selection"
          @change="emit('selected', selection)"
        />
        <ul>
          <li v-for="e of t">
            <img class="w-60" :src="(images as any)[e.id]" :alt="String(e.id)" />
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
