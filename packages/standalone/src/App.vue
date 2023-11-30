<script setup lang="ts">
import { onMounted, ref } from "vue";
import mitt from "mitt";

import {
  startGame,
  PlayerIO,
  StateData,
  RpcMethod,
  RpcRequest,
  RpcResponse,
} from "@gi-tcg/core";
import data from "@gi-tcg/data";
import Chessboard from "./components/Chessboard.vue";

const state0 = ref<StateData>();
const state1 = ref<StateData>();

async function rpc<M extends RpcMethod>(
  m: M,
  req: RpcRequest[M],
): Promise<RpcResponse[M]> {
  switch (m) {
    case "chooseActive":
      const { candidates } = req as RpcRequest["chooseActive"];
      return {
        active: candidates[0],
      } as RpcResponse["chooseActive"] as any;
    default:
      throw new Error("Not implemented");
  }
}

const player0Io: PlayerIO = {
  giveUp: false,
  notify: ({ newState }) => {
    state0.value = newState;
  },
  rpc: rpc,
};

const player1Io: PlayerIO = {
  giveUp: false,
  notify: ({ newState }) => {
    state1.value = newState;
  },
  rpc: rpc,
};

onMounted(() => {
  startGame({
    data,
    io: {
      pause: async () => {
        enableStep.value = true;
        await new Promise<void>((resolve) => {
          emitter.on("step", () => {
            resolve();
          });
        });
        emitter.off("step");
        enableStep.value = false;
      },
      players: [player0Io, player1Io],
    },
    playerConfigs: [
      {
        characters: [1303, 1201, 1502],
        cards: [],
      },
      {
        characters: [1502, 1201, 1303],
        cards: [],
      },
    ],
  });
});

const emitter = mitt<{
  step: void;
}>();
const enableStep = ref(false);
function step() {
  emitter.emit("step");
}
</script>

<template>
  <div class="w-[100vw] h-[100vh] overflow-auto">
    <Chessboard v-if="state0" :data="state0" :who="0"></Chessboard>
    <div class="flex items-center gap-2">
      <h4>Debug</h4>
      <button :disabled="!enableStep" @click="step">Step</button>
    </div>
    <Chessboard v-if="state1" :data="state1" :who="1"></Chessboard>
  </div>
</template>
