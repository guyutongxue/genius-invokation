<script lang="ts" setup>
import { ref } from "vue";
import PlayerArea, { type PlayerAreaData } from "./PlayerArea.vue";
import SwitchHands from "./SwitchHands.vue";
import type {
  MethodNames,
  RequestType,
  Player,
  StateFacade,
  Event,
} from "@jenshin-tcg/core";
import EventEmitter from "eventemitter3";
import RollDice from "./RollDice.vue";

const props = defineProps<{
  playerId: any;
  characters: number[];
  piles: number[];
}>();

const playerType = props.playerId === "A" ? "me" : "dbg";

const areaData = ref<PlayerAreaData>();

const showCardSwitch = ref<boolean>(false);
const showRollDice = ref<boolean>(false);

const ee = new EventEmitter<{
  cardSwitched: [removed: number[]];
  diceSwitched: [removed: number[]];
  cardChosen: [id: number];
  characterChosen: [id: number];
}>();

function stateToAreaData(state: StateFacade): PlayerAreaData {
  return {
    ...state,
    type: "visible",
  };
}

function notificationHandler(id: any, { source, state, damages }: Event) {
  // console.log({ id, source, state, damages });
  switch (source.type) {
    case "phaseBegin": {
    }
  }
  areaData.value = stateToAreaData(state as StateFacade);
}

async function handler(
  this: Player,
  method: MethodNames,
  req: object
): Promise<object> {
  console.log({ method, req });
  switch (method) {
    case "initialize": {
      const { state } = { ...req } as RequestType<"initialize">;
      areaData.value = stateToAreaData(state as StateFacade);
      break;
    }
    case "drawHands": {
      const { hands } = req as RequestType<"drawHands">;
      if (areaData.value && areaData.value.type === "visible") {
        console.log(areaData.value.hands, hands);
        areaData.value.hands = [...areaData.value.hands, ...hands].sort(
          (a, b) => a - b
        );
      }
      break;
    }
    case "removeHands": {
      // const r = req as RequestType<typeof method>;
      const remove = await new Promise<number[]>((resolve) => {
        ee.once("cardSwitched", (d) => resolve(d));
        showCardSwitch.value = true;
      });
      showCardSwitch.value = false;
      if (areaData.value && areaData.value.type === "visible") {
        areaData.value.hands = areaData.value.hands.filter(
          (h) => !remove.includes(h)
        );
      }
      return { remove };
    }
    case "switchActive": {
      const chosen = await new Promise<number>((resolve) => {
        ee.once("characterChosen", (d) => resolve(d));
      });
      if (areaData.value && areaData.value.type === "visible") {
        areaData.value.active = chosen;
      }
      return { target: chosen };
    }
    case "roll": {
      const { dice, canRemove } = req as RequestType<"roll">;
      if (areaData.value && areaData.value.type === "visible") {
        areaData.value.dice = dice;
      }
      if (canRemove) {
        showRollDice.value = true;
        const remove = await new Promise<number[]>((resolve) => {
          ee.once("diceSwitched", (d) => resolve(d));
        });
        showRollDice.value = false;
        return { remove };
      } else {
        return { remove: [] };
      }
    }
    case "notify": {
      const r = req as RequestType<typeof method>;
      notificationHandler(this.id, r.event);
    }
  }
  return { success: true };
}

const player: Player = {
  id: props.playerId,
  characters: props.characters,
  piles: props.piles,
  handler,
};

defineExpose({ player });

function cardChosen(id: number, objectId: number) {
  ee.emit("cardChosen", id);
}
function characterChosen(id: number, objectId: number) {
  ee.emit("characterChosen", id);
}
</script>

<template>
  <div v-if="areaData">
    <PlayerArea
      :player="playerType"
      :data="areaData"
      @clickCharacter="characterChosen"
      @clickHand="cardChosen"
    >
    </PlayerArea>
    <div v-if="areaData.type === 'visible'">
      <SwitchHands
        v-if="showCardSwitch"
        :hands="areaData.hands"
        @selected="ee.emit('cardSwitched', $event)"
      >
      </SwitchHands>
      <RollDice
        v-if="showRollDice"
        :dice="areaData.dice"
        @selected="ee.emit('diceSwitched', $event)"
      ></RollDice>
    </div>
  </div>
</template>
