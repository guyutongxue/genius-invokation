<script lang="ts" setup>
import { ref } from "vue";
import { StateData } from "@gi-tcg/typings";

import PlayerArea from "./PlayerArea.vue";

const state = ref<StateData>();

</script>

<template>
  <div v-if="state">
    <PlayerArea :data="state.players[0]"></PlayerArea>
    <PlayerArea :data="state.players[1]"></PlayerArea>
  </div>
</template>
