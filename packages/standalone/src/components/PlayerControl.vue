<script lang="ts" setup>
import { onMounted, ref } from "vue";
import PlayerArea from "./PlayerArea.vue";
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
} from "@gi-tcg/typings";
import EventEmitter from "eventemitter3";
import RollDice from "./RollDice.vue";
import SelectDice from "./SelectDice.vue";

const props = defineProps<{
  playerId: any;
  playerType?: "me" | "opp";
  characters: number[];
  piles: number[];
}>();

const areaData = ref<MyPlayerData>();
const availableActions = ref<Action[]>([]);

const showCardSwitch = ref<boolean>(false);
const showRollDice = ref<boolean>(false);

const ee = new EventEmitter<{
  cardSwitched: [removed: number[]];
  diceSwitched: [removed: number[]];
  diceSelected: [number[] | undefined];
  endChosen: [];
  cardChosen: [id: number];
  cardTuned: [id: number];
  methodChosen: [string];
  characterChosen: [id: number];
}>();

function stateToAreaData(state: StateData): MyPlayerData {
  return state.players[0];
}

function onNotify({ event, state }: NotificationMessage) {
  // console.log({ id, source, state, damages });
  switch (event.type) {
    case "newGamePhase": {
    }
  }
  areaData.value = stateToAreaData(state);
}

function removePlayAreaListeners() {
  ee.removeAllListeners("endChosen");
  ee.removeAllListeners("cardChosen");
  ee.removeAllListeners("cardTuned");
  ee.removeAllListeners("methodChosen");
  ee.removeAllListeners("characterChosen");
}

const requireSelectedDice = ref<number[]>();
async function useDice(needed: DiceType[]): Promise<DiceType[] | undefined> {
  requireSelectedDice.value = needed;
  const selected = await new Promise<number[] | undefined>((resolve) => {
    ee.once("diceSelected", (selected) => {
      resolve(selected);
    });
  });
  requireSelectedDice.value = undefined;
  return selected;
}

async function handler(method: RpcMethod, req: Request): Promise<Response> {
  console.log({ method, req });
  if (areaData.value) {
    throw new Error("This controller cannot am");
  }
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
      availableActions.value = candidates.map(
        (c): Action => ({
          type: "switchActive",
          active: c,
        })
      );
      const active = await new Promise<number>((resolve) => {
        ee.once("characterChosen", (d) => resolve(d));
      });
      availableActions.value = [];
      return { active } as RpcResponse["chooseActive"];
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
        availableActions.value = candidates;
        type AreaActionResponse =
          | {
              type: "character" | "card" | "elementalTuning";
              id: number;
            }
          | {
              type: "method";
              name: string;
            }
          | {
              type: "end";
            };
        const r = await new Promise<AreaActionResponse>((resolve) => {
          ee.once("cardChosen", (id) => {
            removePlayAreaListeners();
            resolve({ type: "card", id });
          });
          ee.once("cardTuned", (id) => {
            removePlayAreaListeners();
            resolve({ type: "elementalTuning", id });
          });
          ee.once("characterChosen", (id) => {
            removePlayAreaListeners();
            resolve({ type: "character", id });
          });
          ee.once("methodChosen", (name) => {
            removePlayAreaListeners();
            resolve({ type: "method", name });
          });
          ee.once("endChosen", () => {
            removePlayAreaListeners();
            resolve({ type: "end" });
          });
        });
        availableActions.value = [];
        console.log(r);
        let resultAction: RpcResponse["action"];
        switch (r.type) {
          case "end": {
            resultAction = { type: "declareEnd" };
            break;
          }
          case "elementalTuning": {
            const cost = await useDice([DiceType.Void]);
            if (typeof cost === "undefined") continue;
            resultAction = {
              type: "elementalTuning",
              discardedCard: r.id,
              dice: cost as [DiceType],
            };
            // const tgtDice =
            //   (areaData.value.characters[areaData.value.active ?? 0].objectId /
            //     1000) %
            //   100;
            // areaData.value.dice.splice(cost[0], 1, tgtDice);
            break;
          }
          case "character": {
            const spent = await useDice(actions.switchActive.cost);
            if (typeof spent === "undefined") continue;
            resultAction = { type: "switchActive", target: r.id, cost: spent };
            break;
          }
          case "card": {
            const card = actions.cards.find((c) => c.id === r.id);
            if (!card) throw new Error("card not found");
            let withCard:
              | {
                  type: "character" | "support" | "summon";
                  id: number;
                }
              | undefined = undefined;
            if (card.with) {
              const choseWithAction: AreaAction = {
                skills: [],
                cards: [],
                switchActive: {
                  targets: [],
                  cost: [],
                  fast: false,
                },
                myTurn: false,
              };
              for (const cw of card.with) {
                if (cw.type === "character") {
                  choseWithAction.switchActive.targets.push(cw.id);
                } else {
                  throw new Error("not implemented");
                }
              }
              availableActions.value = choseWithAction;
              withCard = await new Promise<{
                type: "character" | "support" | "summon";
                id: number;
              }>((resolve) => {
                ee.once("characterChosen", (id) =>
                  resolve({
                    type: "character",
                    id,
                  })
                );
              });
            }
            const spent = await useDice(card.cost);
            if (typeof spent === "undefined") continue;
            resultAction = {
              type: "playCard",
              card: r.id,
              dice: spent,
              target: withCard,
            };
            // areaData.value.hands.splice(
            //   areaData.value.hands.findIndex((h) => h === r.id),
            //   1
            // );
            // for (const c of spent) {
            //   areaData.value.dice.splice(c, 1);
            // }
            break;
          }
          case "method": {
            const cost =
              actions.skills.find((c) => c.name === r.name)?.cost ?? [];
            const spent = await useDice(cost);
            if (typeof spent === "undefined") continue;
            resultAction = { type: "useSkill", name: r.name, cost: spent };
            break;
          }
        }
        return resultAction;
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
};

const emit = defineEmits<{
  (e: "initialized", config: PlayerConfig): void;
}>();

onMounted(() => {
  emit("initialized", player);
});
</script>

<template>
  <div v-if="areaData" class="relative">
    <PlayerArea
      :player="playerType ?? 'me'"
      :data="areaData"
      :availableActions="availableActions"
      @clickCharacter="ee.emit('characterChosen', $event)"
      @clickMethod="ee.emit('methodChosen', $event)"
      @clickEnd="ee.emit('endChosen')"
      @tuneHand="ee.emit('cardTuned', $event)"
      @clickHand="ee.emit('cardChosen', $event)"
    >
    </PlayerArea>
    <div v-if="areaData.type === 'my'">
      <SwitchHands
        class="absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-70"
        v-if="showCardSwitch"
        :hands="areaData.hands"
        @selected="ee.emit('cardSwitched', $event)"
      >
      </SwitchHands>
      <RollDice
        class="absolute top-0 left-0 bottom-0 right-0 bg-black bg-opacity-70"
        v-if="showRollDice"
        :dice="areaData.dice"
        @selected="ee.emit('diceSwitched', $event)"
      >
      </RollDice>
      <SelectDice
        class="absolute top-0 right-0 h-full bg-white outline outline-4 outline-green-400"
        v-if="requireSelectedDice"
        :dice="areaData.dice"
        :required="requireSelectedDice"
        @selected="ee.emit('diceSelected', $event)"
        @cancelled="ee.emit('diceSelected', undefined)"
      >
      </SelectDice>
    </div>
  </div>
</template>
