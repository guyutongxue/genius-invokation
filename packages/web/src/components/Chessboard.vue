<script lang="ts" setup>
import { onMounted, ref } from "vue";
import PlayerControl from "./PlayerControl.vue";
import { createGame } from "@jenshin-tcg/core";

const c0 = ref<InstanceType<typeof PlayerControl> | null>(null);
const c1 = ref<InstanceType<typeof PlayerControl> | null>(null);

const player0 = {
  characters: [10008, 10013, 10032],
  piles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};

const player1 = {
  characters: [10008, 10008, 10008], //[3, 4, 5],
  piles: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
};

function startGame() {
  if (!c0.value || !c1.value) {
    alert("c0 or c1 is not ready");
    return;
  }
  createGame({
    pvp: true,
    players: [c0.value.player, c1.value.player],
  });
}

onMounted(() => {});
</script>

<template>
  <button class="bg-blue-300 p-2" @click="startGame()">START</button>
  <div class="flex flex-col gap-1">
    <PlayerControl
      ref="c1"
      playerId="B"
      :characters="player1.characters"
      :piles="player1.piles"
    ></PlayerControl>
    <PlayerControl
      ref="c0"
      playerId="A"
      :characters="player0.characters"
      :piles="player0.piles"
    ></PlayerControl>
  </div>
</template>
