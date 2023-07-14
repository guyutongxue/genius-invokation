<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import PlayerArea, { Clickable } from "./PlayerArea.vue";
import SwitchHands from "./SwitchHands.vue";
import { PlayerConfig } from "@gi-tcg/core";
import {
  DiceType,
  Request,
  StateData,
  Response,
  NotificationMessage,
  RpcMethod,
  RpcResponse,
  RpcRequest,
  MyPlayerData,
  Action,
  Handler,
  PlayCardTargets,
} from "@gi-tcg/typings";
import EventEmitter from "eventemitter3";
import RollDice from "./RollDice.vue";
import SelectDice from "./SelectDice.vue";
import Dice from "./Dice.vue";

const props = defineProps<{
  characters: number[];
  piles: number[];
}>();

const stateData = ref<StateData>();
const availableActions = ref<Clickable[]>([]);

const showCardSwitch = ref<boolean>(false);
const showRollDice = ref<boolean>(false);

const ee = new EventEmitter<{
  cardSwitched: [removed: number[]];
  diceSwitched: [removed: number[]];
  diceSelected: [dice: number[] | undefined, targets: number];
  acted: [selectedActionIndex: number];
}>();

function onNotify({ event, state }: NotificationMessage) {
  console.log({ event, state });
  switch (event.type) {
    case "newGamePhase": {
    }
  }
  stateData.value = state;
}

const requireSelectedDice = ref<number[]>();
const requireTargets = ref<PlayCardTargets>();
async function useDice(
  needed: DiceType[],
  target?: PlayCardTargets
): Promise<[DiceType[], number] | undefined> {
  requireSelectedDice.value = needed;
  requireTargets.value = target;
  const selected = await new Promise<[number[], number] | undefined>(
    (resolve) => {
      ee.once("diceSelected", (selected, target) => {
        if (typeof selected === "undefined") return resolve(undefined);
        resolve([selected, target]);
      });
    }
  );
  requireSelectedDice.value = undefined;
  requireTargets.value = undefined;
  return selected;
}

async function handler(method: RpcMethod, req: Request): Promise<Response> {
  console.log({ method, req });
  switch (method) {
    case "switchHands": {
      showCardSwitch.value = true;
      const removedHands = await new Promise<number[]>((resolve) => {
        ee.once("cardSwitched", (d) => resolve(d));
      });
      showCardSwitch.value = false;
      return { removedHands } as RpcResponse["switchHands"];
    }
    case "chooseActive": {
      const { candidates } = req as RpcRequest["chooseActive"];
      availableActions.value = candidates.map((c): Clickable => ({
        type: "entity",
        entityId: c,
      }));
      const idx = await new Promise<number>((resolve) => {
        ee.once("acted", resolve);
      });
      availableActions.value = [];
      const target = candidates[idx];
      return { active: target } as RpcResponse["chooseActive"];
    }
    case "rerollDice": {
      showRollDice.value = true;
      const rerollIndexes = await new Promise<number[]>((resolve) => {
        ee.once("diceSwitched", (d) => resolve(d));
      });
      showRollDice.value = false;
      return { rerollIndexes } as RpcResponse["rerollDice"];
    }
    case "action": {
      const { candidates } = req as RpcRequest["action"];
      while (true) {
        availableActions.value = candidates.map((a): Clickable => {
          switch (a.type) {
            case "declareEnd": return { type: "declareEnd" };
            case "elementalTuning": return { type: "elementalTuning", entityId: a.discardedCard };
            case "playCard": return { type: "entity", entityId: a.card, cost: a.cost };
            case "switchActive": return { type: "entity", entityId: a.active, cost: a.cost };
            case "useSkill": return { type: "skill", id: a.skill, cost: a.cost };
            default: throw new Error("unreachable");
          }
        });
        const actionIdx = await new Promise<number>((resolve) => {
          ee.once("acted", resolve);
        });
        availableActions.value = [];
        const selectedAction = candidates[actionIdx];
        console.log(selectedAction);
        let r: RpcResponse["action"]; // type check only
        switch (selectedAction.type) {
          case "declareEnd": {
            return (r = { type: "declareEnd" });
          }
          case "elementalTuning": {
            const cost = await useDice([DiceType.Void]);
            if (typeof cost === "undefined") continue;
            return (r = {
              type: "elementalTuning",
              discardedCard: selectedAction.discardedCard,
              dice: cost[0] as [DiceType],
            });
          }
          case "switchActive": {
            const spent = await useDice(selectedAction.cost);
            if (typeof spent === "undefined") continue;
            return (r = {
              type: "switchActive",
              active: selectedAction.active,
              dice: spent[0],
            });
          }
          case "playCard": {
            const cardTarget = selectedAction.target;
            const spent = await useDice(selectedAction.cost, cardTarget);
            if (typeof spent === "undefined") continue;
            return (r = {
              type: "playCard",
              card: selectedAction.card,
              dice: spent[0],
              targetIndex: spent[1],
            });
          }
          case "useSkill": {
            const spent = await useDice(selectedAction.cost);
            if (typeof spent === "undefined") continue;
            return (r = {
              type: "useSkill",
              skill: selectedAction.skill,
              dice: spent[0],
            });
          }
        }
      }
    }
  }
}

const player: PlayerConfig = {
  deck: {
    characters: props.characters,
    actions: props.piles,
  },
  handler: handler as Handler,
  onNotify,
  // noShuffle: true
};

function diceSelected(dice: DiceType[], targetIdx?: number) {
  ee.emit("diceSelected", dice, targetIdx ?? 0);
}

const emit = defineEmits<{
  (e: "initialized", config: PlayerConfig): void;
}>();

onMounted(() => {
  emit("initialized", player);
});
</script>

<template>
  <div v-if="stateData" class="relative">
    <div class="flex flex-row">
      <div class="flex-grow flex flex-col gap-2">
        <PlayerArea
          :data="stateData.players[1]"
          :availableActions="availableActions"
          @click="ee.emit('acted', $event)"
        >
        </PlayerArea>
        <PlayerArea
          :data="stateData.players[0]"
          :availableActions="availableActions"
          @click="ee.emit('acted', $event)"
        >
        </PlayerArea>
      </div>
      <div class="bg-yellow-800 text-white flex flex-col p-2 gap-[1px]">
        <div v-for="d of stateData.players[0].dice">
          <Dice :type="d"></Dice>
        </div>
      </div>
    </div>
    <SwitchHands
      class="absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-70"
      v-if="showCardSwitch"
      :hands="stateData.players[0].hands"
      @selected="ee.emit('cardSwitched', $event)"
    >
    </SwitchHands>
    <RollDice
      class="absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-70"
      v-if="showRollDice"
      :dice="stateData.players[0].dice"
      @selected="ee.emit('diceSwitched', $event)"
    >
    </RollDice>
    <SelectDice
      class="absolute top-0 right-0 h-full bg-white outline outline-4 outline-green-400"
      v-if="requireSelectedDice"
      :dice="stateData.players[0].dice"
      :required="requireSelectedDice"
      :targets="requireTargets"
      @selected="diceSelected"
      @cancelled="ee.emit('diceSelected', undefined, 0)"
    >
    </SelectDice>
  </div>
</template>
