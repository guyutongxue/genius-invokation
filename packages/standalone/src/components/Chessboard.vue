<script lang="ts" setup>
import { StateData } from "@gi-tcg/typings";

import PlayerArea from "./PlayerArea.vue";

defineProps<{
  data: StateData;
  who: 0 | 1;
}>();
</script>

<template>
  <div
    class="w-full b-solid b-black b-2 flex"
    :class="who === 0 ? 'flex-col-reverse' : 'flex-col'"
  >
    <PlayerArea :data="data.players[0]" :opp="who !== 0"></PlayerArea>
    <div class="bg-yellow-100">
      round = {{ data.roundNumber }};
      <!-- -->
      phase = {{ data.phase }};
      <!-- -->
      turn = {{ data.currentTurn }} ({{
        data.currentTurn === who ? "me" : "opp"
      }})
    </div>
    <PlayerArea :data="data.players[1]" :opp="who !== 1"></PlayerArea>
  </div>
</template>
