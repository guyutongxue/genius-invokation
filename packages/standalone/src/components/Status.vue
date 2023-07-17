<script lang="ts" setup>
import { computed } from "vue";
import icons from "../assets/icons.json";
import { StatusData } from "@gi-tcg/typings";

const props = defineProps<{
  status: StatusData;
}>();

const iconName = computed(() => {
  const key = String(props.status.id);
  return (icons as any)[key] ?? "UI_Gcg_Buff_Common_More.png";
});
</script>
<template>
  <div class="relative">
    <img
      :title="String(status.id)"
      :src="'https://guyutongxue.site/gcg-buff-icon-data/Sprite/' + iconName"
      class="w-5 h-5"
    />
    <span v-if="'value' in status" class="absolute text-sm right-0 bottom-0">
      {{ status.value }}
    </span>
  </div>
</template>
