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
  PlayCardSingleTarget,
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
  diceSelected: [dice: number[] | undefined];
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
const disableDiceOk = ref<boolean>(false);
const disableOmniDice = ref<boolean>(false);
async function useDice(needed: DiceType[]): Promise<DiceType[] | undefined> {
  requireSelectedDice.value = needed;
  const selected = await new Promise<number[] | undefined>((resolve) => {
    ee.once("diceSelected", (selected) => {
      if (typeof selected === "undefined") return resolve(undefined);
      resolve(selected);
    });
  });
  requireSelectedDice.value = undefined;
  return selected;
}

async function requestAction(clickable: Clickable[]): Promise<number> {
  availableActions.value = clickable;
  const result = await new Promise<number>((resolve) => {
    ee.once("acted", resolve);
  });
  availableActions.value = [];
  return result;
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
      const idx = await requestAction(
        candidates.map(
          (c): Clickable => ({
            type: "entity",
            entityId: c,
          })
        )
      );
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
        const clickable = candidates.map((a): Clickable => {
          switch (a.type) {
            case "declareEnd":
              return { type: "declareEnd" };
            case "elementalTuning":
              return { type: "elementalTuning", entityId: a.discardedCard };
            case "playCard":
              return { type: "entity", entityId: a.card, cost: a.cost };
            case "switchActive":
              return { type: "entity", entityId: a.active, cost: a.cost };
            case "useSkill":
              return { type: "skill", id: a.skill, cost: a.cost };
          }
        });
        const actionIdx = await requestAction(clickable);
        const selectedAction = candidates[actionIdx];
        console.log(selectedAction);
        let r: RpcResponse["action"]; // type check only
        switch (selectedAction.type) {
          case "declareEnd": {
            return (r = { type: "declareEnd" });
          }
          case "elementalTuning": {
            disableOmniDice.value = true;
            const cost = await useDice([DiceType.Void]);
            disableOmniDice.value = false;
            if (typeof cost === "undefined") continue;
            return (r = {
              type: "elementalTuning",
              discardedCard: selectedAction.discardedCard,
              dice: cost as [DiceType],
            });
          }
          case "switchActive": {
            availableActions.value = [
              {
                type: "entity",
                entityId: selectedAction.active,
                withMark: true,
              },
            ];
            const spent = await useDice(selectedAction.cost);
            availableActions.value = [];
            if (typeof spent === "undefined") continue;
            return (r = {
              type: "switchActive",
              active: selectedAction.active,
              dice: spent,
            });
          }
          case "playCard": {
            const cardTarget = selectedAction.target?.candidates ?? [[]];
            // TODO
            let selectedTarget = 0;
            let candidates: [number[], number][] = [];
            const lengthCheck = new Set<number>();
            for (let i = 0; i < cardTarget.length; i++) {
              const entities = cardTarget[i].map((e) => e.entityId);
              candidates.push([entities, i]);
              lengthCheck.add(entities.length);
            }
            // Assume that every candidate has same length
            if (lengthCheck.size !== 1) {
              throw new Error("Cannot deal with mismatch length targets");
            }
            let spent: number[] | undefined;
            while (true) {
              const restLength = candidates[0][0].length;
              // If no target needed, break
              if (restLength === 0) {
                // 当不需要目标时，直接显示骰子窗口
                selectedTarget = candidates[0][1];
                spent = await useDice(selectedAction.cost);
                break;
              } else if (restLength === 1) {
                // 当卡牌目标只有一步操作时，在显示卡牌选择框的同时，显示骰子窗口
                let selectedEntityIdx: number | undefined = undefined;
                if (candidates.length === 1) {
                  selectedEntityIdx = 0;
                }
                disableDiceOk.value = typeof selectedEntityIdx === "undefined";
                availableActions.value = candidates.map(([c], i) => ({
                  type: "entity",
                  entityId: c[0],
                  withMark: i === selectedEntityIdx,
                }));
                const handler = ee.on("acted", (idx) => {
                  selectedEntityIdx = idx;
                  disableDiceOk.value =
                    typeof selectedEntityIdx === "undefined";
                  availableActions.value.forEach((a, i) => {
                    if (a.type === "entity") {
                      a.withMark = i === selectedEntityIdx;
                    }
                  });
                });
                spent = await useDice(selectedAction.cost);
                if (typeof selectedEntityIdx === "undefined") {
                  // Cancelled while selecting target
                  break;
                }
                selectedTarget = candidates[selectedEntityIdx][1];
                disableDiceOk.value = false;
                availableActions.value = [];
                break;
              } else {
                // 当多于一步操作目标时，这一步先选择第一个目标，不显示“勾”，不显示骰子窗口
                const firstCandidate = [
                  ...new Set(candidates.map((a) => a[0][0])),
                ];
                const selected = await requestAction(
                  firstCandidate.map((e) => ({
                    type: "entity",
                    entityId: e,
                  }))
                );
                candidates = candidates.filter(
                  ([c, i]) => c[0] === firstCandidate[selected]
                );
                candidates.forEach(([c, i]) => c.shift());
              }
            }
            if (typeof spent === "undefined") continue;
            return (r = {
              type: "playCard",
              card: selectedAction.card,
              dice: spent,
              targetIndex: selectedTarget,
            });
          }
          case "useSkill": {
            const spent = await useDice(selectedAction.cost);
            if (typeof spent === "undefined") continue;
            return (r = {
              type: "useSkill",
              skill: selectedAction.skill,
              dice: spent,
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
  // noShuffle: true,
};

function diceSelected(dice: DiceType[]) {
  ee.emit("diceSelected", dice);
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
    <div class="flex flex-row items-stretch">
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
      <SelectDice
        class="bg-yellow-800"
        v-if="requireSelectedDice"
        :dice="stateData.players[0].dice"
        :required="requireSelectedDice"
        :disableOk="disableDiceOk"
        :disableOmni="disableOmniDice"
        @selected="diceSelected"
        @cancelled="ee.emit('diceSelected', undefined)"
      >
      </SelectDice>
      <div v-else class="bg-yellow-800 text-white flex flex-col p-2 gap-[1px]">
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
  </div>
</template>
