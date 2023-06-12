<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import PlayerArea, { type PlayerAreaData } from './PlayerArea.vue';
import { MethodNames, Player, RequestType, StateFacade, createGame } from '@jenshin-tcg/core';

const data0 = ref<PlayerAreaData>();
const data1 = ref<PlayerAreaData>();

async function handle(
  this: Player,
  method: MethodNames,
  req: unknown
): Promise<unknown> {
  switch (method) {
    case "initialize": {
      // const r = req as RequestType<"initialize">;
      // console.log(this, req);
      return { success: true };
    }
    case "switchHands": {
      const r = req as RequestType<typeof method>;
      console.log(this, req);
      if (r.canRemove) {
        return { removedHands: [0, 1, 2] };
      } else {
        return { removedHands: [] };
      }
    }
    case "eventArrived": {
      const r = req as RequestType<typeof method>;
      switch (r.event.type) {
        case "updateState": {
          const state = r.event.state;
          if (this.id === "A") {
            // @ts-expect-error no typing for this
            data0.value = {
              ...state,
              type: "hidden"
            };
          } else {
            // @ts-expect-error no typing for this
            data1.value = {
              ...state,
              type: "hidden"
            }
          }
        }
      }
      return { success: true };
    }
    default:
      return { success: false };
  }
}
const player0: Player = {
  id: "A",
  characters: [0, 0, 0], //[0, 1, 2],
  piles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  handle,
};

const player1: Player = {
  id: "B",
  characters: [0, 0, 0], //[3, 4, 5],
  piles: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  handle,
};


onMounted(() => {
  createGame({
    pvp: true,
    players: [player0, player1],
  })
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <PlayerArea v-if="data1" player="dbg" :data="data1"></PlayerArea>
    <PlayerArea v-if="data0" player="me" :data="data0"></PlayerArea>
  </div>
</template>
