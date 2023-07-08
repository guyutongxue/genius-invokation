<script lang="ts" setup>
import { ref } from "vue";
import PlayerControl from "./PlayerControl.vue";
import { Game, GameController, PlayerConfig } from "@gi-tcg/core";


const player0 = {
  characters: [1303, 1306, 1403],
  piles: [333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010, 333005, 333011, 333009, 333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010, 333005, 333011, 333009],
};

const player1 = {
  characters: [1204, 1603, 1303], //[3, 4, 5],
  piles: [333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010, 333005, 333011, 333009, 333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010, 333005, 333011, 333009],
};

const game = new Game();
const started = ref(false);

function initializePlayer(p: 0 | 1, config: PlayerConfig) {
  const controller = game.registerPlayer(p, config);
  controller.ready();
}

</script>

<template>
  <button class="btn btn-primary" @click="started = true">启动</button>
  <div class="flex flex-col-reverse gap-1" v-if="started">
    <PlayerControl
      ref="c0"
      playerId="A"
      playerType="me"
      :characters="player0.characters"
      :piles="player0.piles"
      @initialized="initializePlayer(0, $event)"
    ></PlayerControl>
    <PlayerControl
      ref="c1"
      playerId="B"
      playerType="opp"
      :characters="player1.characters"
      :piles="player1.piles"
      @initialized="initializePlayer(1, $event)"
    ></PlayerControl>
  </div>
</template>
