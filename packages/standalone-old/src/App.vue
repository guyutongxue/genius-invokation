<script setup lang="ts">
import { logs } from "./logs";
import Chessboard from "./components/Chessboard.vue";
import { Game, PlayerConfig } from "@gi-tcg/core";
import { onMounted, ref } from "vue";
import { preloadAllImages, progress, total } from "./assets/preload";
import Casket, { Deck } from "./components/Casket.vue";
import DeckPreview from "./components/DeckPreview.vue";

const game = new Game();
const started = ref(false);

function initializePlayer(p: 0 | 1, config: PlayerConfig) {
  const controller = game.registerPlayer(p, config);
  controller.ready();
}

function readDeckFromCache() {
  const deck0 =
    localStorage.getItem("deck0") ??
    `{"characters":[1203,1703,1306],"piles":[311103,311103,312004,312004,321007,321007,321011,321011,322001,322007,322008,322008,322014,330002,330002,331801,331801,332001,332001,332003,332004,332004,332005,332005,332006,332006,333003,333003,333006,333006]}`;
  const deck1 =
    localStorage.getItem("deck1") ??
    `{"characters":[1303,1306,1403],"piles":[333002,333012,333001,333003,330001,333006,333007,333004,333010,333005,333011,333009,213031,213061,214031,311502,311103,312009,312002,312301,322010,322005,323001,321002,322001,322008,321007,321011,332011,332005]}
`;
  player0.value = JSON.parse(deck0);
  player1.value = JSON.parse(deck1);
}

const player0 = ref<Deck>();
const player1 = ref<Deck>();

const loaded = ref(false);
const modifyingPlayer = ref<0 | 1 | null>(null);

function modifyDeck(data: Deck) {
  if (modifyingPlayer.value === 0) {
    player0.value = data;
    localStorage.setItem("deck0", JSON.stringify(data));
  } else {
    player1.value = data;
    localStorage.setItem("deck1", JSON.stringify(data));
  }
  cancelModifyDeck();
}
function cancelModifyDeck() {
  (document.querySelector("#casketModal") as HTMLDialogElement).close();
  modifyingPlayer.value = null;
}
function setDeck(who: 0 | 1) {
  modifyingPlayer.value = who;
  (document.querySelector("#casketModal") as HTMLDialogElement).showModal();
}

onMounted(async () => {
  readDeckFromCache();
  loaded.value = true; // 需要一些更好的办法……
  preloadAllImages();
});
</script>

<template>
  <div
    v-if="!loaded"
    class="h-screen w-screen flex justify-center items-center flex-col gap-2"
  >
    <h1 class="text-2xl">加载中...</h1>
    <progress class="progress w-56" :value="progress" :max="total"></progress>
  </div>
  <div v-else-if="player0 && player1 && started">
    <Chessboard
      debug
      v-bind="player0"
      @initialized="initializePlayer(0, $event)"
    ></Chessboard>
    <div class="my-6 bg-primary h-1"></div>
    <Chessboard
      v-bind="player1"
      @initialized="initializePlayer(1, $event)"
    ></Chessboard>
  </div>
  <div
    v-else
    class="flex flex-col h-screen w-screen justify-center items-center gap-4"
  >
    <div class="flex gap-6 items-end">
      <div class="flex flex-col m-2 items-center">
        <DeckPreview v-if="player0" :deck="player0" />
        <button class="btn mt-2" @click="setDeck(0)">
          设置先手玩家牌组...
        </button>
      </div>
      <div class="flex flex-col m-2 items-center">
        <DeckPreview v-if="player1" :deck="player1" />
        <button class="btn mt-2" @click="setDeck(1)">
          设置后手玩家牌组...
        </button>
      </div>
    </div>
    <button
      class="btn btn-primary"
      :disabled="!player0 || !player1"
      @click="started = true"
    >
      启动
    </button>
  </div>
  <ul>
    <li v-for="log of logs">
      {{ log }}
    </li>
  </ul>
  <dialog id="casketModal" class="h-screen w-screen m-5">
    <Casket
      v-if="modifyingPlayer !== null"
      :initialDeck="modifyingPlayer === 0 ? player0 : player1"
      @submit="modifyDeck"
      @cancel="cancelModifyDeck"
    ></Casket>
  </dialog>
</template>
