<script lang="ts" setup>
import { StateData } from "@gi-tcg/typings";

import PlayerArea from "./PlayerArea.vue";
import { Player } from "../player";

const props = defineProps<{
  player: Player;
}>();

const who = props.player.who;
const data = props.player.state;
const outlined = props.player.outlined;
const selected = props.player.selected;
</script>

<template>
  <div
    v-if="data"
    class="w-full b-solid b-black b-2 flex"
    :class="who === 0 ? 'flex-col-reverse' : 'flex-col'"
  >
    <PlayerArea
      :data="data.players[0]"
      :opp="who !== 0"
      :outlined="outlined"
      :selected="selected"
    ></PlayerArea>
    <div class="bg-yellow-100">
      round = {{ data.roundNumber }};
      <!-- -->
      phase = {{ data.phase }};
      <!-- -->
      turn = {{ data.currentTurn }} ({{
        data.currentTurn === who ? "me" : "opp"
      }})
    </div>
    <PlayerArea
      :data="data.players[1]"
      :opp="who !== 1"
      :outlined="outlined"
      :selected="selected"
    ></PlayerArea>
  </div>
</template>
