<script setup lang="ts">
import { onMounted, ref } from "vue";
import { startGame, PlayerIO } from "@gi-tcg/data-new";
import { StateData } from "@gi-tcg/typings";
import Chessboard from "./components/Chessboard.vue";

const state0 = ref<StateData>();
const state1 = ref<StateData>();

const player0Io: PlayerIO = {
  giveUp: false,
  notify: ({ newState }) => {
    state0.value = newState
  },
  rpc: async() => {
    throw new Error("not implemented");
  }
};

const player1Io: PlayerIO = {
  giveUp: false,
  notify: ({ newState }) => {
    state1.value = newState
  },
  rpc: async() => {
    throw new Error("not implemented");
  }
};

onMounted(() => {
  startGame({
    io: {
      pause: async () => {},
      players: [
        player0Io,
        player1Io
      ],
    },
    playerConfigs: [
      {
        characters: [1001, 1001],
        cards: []
      },
      {
        characters: [1001],
        cards: []
      }
    ]
  });
});
</script>

<template>
  <Chessboard v-if="state0" :data="state0"></Chessboard>
  <Chessboard v-if="state1" :data="state0"></Chessboard>
</template>
