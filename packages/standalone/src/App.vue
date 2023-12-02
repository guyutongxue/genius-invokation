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

async function doRpc<M extends RpcMethod>(
  m: M,
  req: RpcRequest[M],
  who: 0 | 1,
): Promise<RpcResponse[RpcMethod]> {
  switch (m) {
    case "chooseActive":
      const { candidates } = req as RpcRequest["chooseActive"];
      return {
        active: candidates[0],
      } as RpcResponse["chooseActive"];
    case "rerollDice":
      return {
        rerollIndexes: [],
      } as RpcResponse["rerollDice"];
    default:
      throw new Error("Not implemented");
  }
}

async function rpc<M extends RpcMethod>(
  m: M,
  req: RpcRequest[M],
  who: 0 | 1,
): Promise<RpcResponse[M]> {
  const res = await doRpc(m, req, who);
  console.log("RPC", m, req, who, res);
  return res as any;
}

const player0Io: PlayerIO = {
  giveUp: false,
  notify: ({ newState, events, mutations }) => {
    console.log(mutations);
    state0.value = newState;
  },
  rpc: (m, r) => rpc(m, r, 0),
};

const player1Io: PlayerIO = {
  giveUp: false,
  notify: ({ newState }) => {
    state1.value = newState;
  },
  rpc: (m, r) => rpc(m, r, 1),
};

onMounted(async () => {
  const winner = await startGame({
    data,
    io: {
      pause: async () => {
        enableStep.value = true;
        await new Promise<void>((resolve) => {
          emitter.on("step", resolve);
        });
        emitter.off("step");
        enableStep.value = false;
      },
      players: [player0Io, player1Io],
    },
    playerConfigs: [
      {
        characters: [1303, 1201, 1502],
        cards: [331502, 332004, 332001, 332019, 331502, 332004, 332001, 332019],
      },
      {
        characters: [1502, 1201, 1303],
        cards: [331502, 332004, 332001, 332019, 331502, 332004, 332001, 332019],
      },
    ],
  });
  console.log("Winner is", winner);
});

const emitter = mitt<{
  step: void;
}>();
const enableStep = ref(false);
</script>

<template>
  <div class="w-[100vw] h-[100vh] overflow-auto">
    <div class="flex items-center gap-2">
      <h4>Debug</h4>
      <button :disabled="!enableStep" @click="emitter.emit('step')">
        Step
      </button>
    </div>
    <Chessboard v-if="state0" :data="state0" :who="0"></Chessboard>
    <Chessboard v-if="state1" :data="state1" :who="1"></Chessboard>
  </div>
</template>
