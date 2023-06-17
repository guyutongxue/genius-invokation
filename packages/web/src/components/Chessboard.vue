<script lang="ts" setup>
import { onMounted, ref } from "vue";
import PlayerControl from "./PlayerControl.vue";
import { createGame } from "@jenshin-tcg/core";

const c0 = ref<InstanceType<typeof PlayerControl> | null>(null);
const c1 = ref<InstanceType<typeof PlayerControl> | null>(null);

const player0 = {
  characters: [1303, 1306, 1403],
  piles: [333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010, 333005, 333011, 333009, 333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010, 333005, 333011, 333009],
};

const player1 = {
  characters: [1303, 1303, 1303], //[3, 4, 5],
  piles: [333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010, 333005, 333011, 333009, 333002, 333012, 333001, 333003, 333008, 333006, 333007, 333004, 333010, 333005, 333011, 333009],
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
  <button class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800" @click="startGame()">START</button>
  <div class="flex flex-col gap-1">
    <PlayerControl
      ref="c1"
      playerId="B"
      playerType="opp"
      :characters="player1.characters"
      :piles="player1.piles"
    ></PlayerControl>
    <PlayerControl
      ref="c0"
      playerId="A"
      playerType="me"
      :characters="player0.characters"
      :piles="player0.piles"
    ></PlayerControl>
  </div>
</template>
