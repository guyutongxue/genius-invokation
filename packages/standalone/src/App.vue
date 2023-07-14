<script setup lang="ts">
import { DiceType } from "@gi-tcg/typings";
import Chessboard from "./components/Chessboard.vue";
import { Game, PlayerConfig } from "@gi-tcg/core";
import { ref } from "vue";

const game = new Game();
const started = ref(false);

function initializePlayer(p: 0 | 1, config: PlayerConfig) {
  const controller = game.registerPlayer(p, config);
  controller.ready();
}

const player0 = {
  characters: [1303, 1306, 1403],
  piles: [
    333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010,
    333005, 333011, 333009, 213031, 213061, 214031, 311502, 311103, 312009,
    312002, 312301, 322010, 322005, 323001, 321002, 322001, 322008, 321007,
    321011, 332011, 332005,
  ],
};

const player1 = {
  characters: [1204, 1603, 1503],
  piles: [
    333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010,
    333005, 333011, 333009, 212041, 216031, 215031, 311502, 311103, 312009,
    312002, 312004, 322010, 322005, 323001, 321002, 322001, 322008, 321007,
    321011, 332011, 332005,
  ],
};
</script>

<template>
  <button v-if="!started" class="btn btn-primary" @click="started = true">
    启动
  </button>
  <div v-else>
    <Chessboard
      v-bind="player0"
      @initialized="initializePlayer(0, $event)"
    ></Chessboard>
    <div class="my-6 bg-primary h-1"></div>
    <Chessboard
      v-bind="player1"
      @initialized="initializePlayer(1, $event)"
    ></Chessboard>
  </div>
</template>
