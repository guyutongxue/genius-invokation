<script lang="ts" setup>
import { ref } from "vue";
import PlayerArea, { AreaAction, type PlayerAreaData } from "./PlayerArea.vue";
import SwitchHands from "./SwitchHands.vue";
import type {
  MethodNames,
  RequestType,
  Player,
  StateFacade,
  Event,
  DiceType,
  ResponseType,
} from "@jenshin-tcg/core";
import EventEmitter from "eventemitter3";
import RollDice from "./RollDice.vue";
import SelectDice from "./SelectDice.vue";

const props = defineProps<{
  playerId: any;
  playerType?: "me" | "opp";
  characters: number[];
  piles: number[];
}>();

const areaData = ref<PlayerAreaData>();
const availableActions = ref<AreaAction>();

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
      const r = req as RequestType<typeof method>;
      availableActions.value = {
        cards: [],
        skills: [],
        switchActive: {
          targets: r.targets,
          cost: [],
          fast: false,
        },
        myTurn: false,
      };
      const chosen = await new Promise<number>((resolve) => {
        ee.once("characterChosen", (d) => resolve(d));
      });
      availableActions.value = undefined;
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
    case "action": {
      const actions = req as RequestType<"action">;
      if (areaData.value?.type !== "visible") {
        throw new Error("I cannot make actions!");
      }
      while (true) {
        availableActions.value = { ...actions, myTurn: true };
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
        availableActions.value = undefined;
        console.log(r);
        let resultAction: ResponseType<"action">["action"];
        switch (r.type) {
          case "end": {
            resultAction = { type: "declareEnd" };
            break;
          }
          case "elementalTuning": {
            resultAction = { type: "elementalTuning", card: r.id };
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
              cost: spent,
              with: withCard,
            };
            areaData.value.hands.splice(
              areaData.value.hands.findIndex((h) => h === r.id),
              1
            );
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
        return { action: resultAction };
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
    <div v-if="areaData.type === 'visible'">
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
        class="absolute top-0 right-0 h-full bg-white border-4 border-green-500"
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
