<script lang="ts" setup>
import { DiceType, StateData } from "@gi-tcg/typings";
import { flip } from "@gi-tcg/utils";

import PlayerArea from "./PlayerArea.vue";
import { DECLARE_END_ID, ELEMENTAL_TUNING_OFFSET, Player } from "../player";
import SkillButton from "./SkillButton.vue";
import { computed, ref, watch } from "vue";
import { initiativeSkillData } from "../static_data";
import Dice from "./Dice.vue";
import SelectDice from "./SelectDice.vue";
import RollDice from "./RollDice.vue";
import SwitchHands from "./SwitchHands.vue";

const props = defineProps<{
  player: Player;
}>();

function entityClicked(id: number) {
  props.player.entityClicked(id);
}

const {
  who,
  state: data,
  clickable,
  selected,
  view,
  selectDiceOpt,
} = props.player;

const skillList = computed(() => {
  if (!data.value) {
    return [];
  }
  const player = data.value.players[who];
  const activeCh = player.characters.find(
    (ch) => ch.id === player.activeCharacterId,
  );
  if (activeCh) {
    return initiativeSkillData[activeCh.definitionId];
  } else {
    return [];
  }
});

const oppDiceCount = computed(() => {
  if (!data.value) return 0;
  return data.value.players[flip(who)].dice.length;
});
const myDice = computed(() => {
  if (!data.value) return [];
  return data.value.players[who].dice;
});

const showCardDropDiv = ref(false);

function myDiceDragenterHandler(e: DragEvent) {
  e.preventDefault();
}
function myDiceDragoverHandler(e: DragEvent) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = "move";
}
function myDiceDragleaveHandler(e: DragEvent) {
  e.preventDefault();
}
function myDiceDropHandler(e: DragEvent) {
  e.preventDefault();
  (e.target! as HTMLElement).classList.remove("dropping");
  const id = parseInt(e.dataTransfer!.getData("text/plain"));
  entityClicked(id + ELEMENTAL_TUNING_OFFSET);
  showCardDropDiv.value = true;
}
</script>

<template>
  <div v-if="data" class="w-full b-solid b-black b-2 relative select-none">
    <div
      class="h-full w-full flex relative pr-8"
      :class="who === 0 ? 'flex-col-reverse' : 'flex-col'"
    >
      <PlayerArea
        v-for="i of [0, 1] as const"
        :data="data.players[i]"
        :opp="who !== i"
        :clickable="clickable"
        :selected="selected"
        @click="entityClicked($event)"
        @cardDragstart="showCardDropDiv = true"
        @cardDragend="showCardDropDiv = false"
      ></PlayerArea>
      <div class="absolute right-10 bottom-0 flex flex-row gap-1">
        <SkillButton
          v-for="id of skillList"
          :id="id"
          :enabled="clickable.includes(id)"
          @click="entityClicked(id)"
        ></SkillButton>
      </div>
      <div class="absolute left-0 top-[50%] translate-y-[-50%]">
        <div
          class="absolute left-5 top--2 translate-y-[-100%] translate-x-[-50%]"
        >
          <Dice
            :value="DiceType.Omni"
            :text="`${oppDiceCount}`"
            :size="32"
          ></Dice>
        </div>
        <div class="flex items-center gap-2">
          <div
            class="w-20 h-20 rounded-10 flex flex-col items-center justify-center border-8 border-solid border-yellow-800"
            :class="{
              'bg-yellow-300': data.currentTurn === who,
              'bg-blue-200': data.currentTurn !== who,
            }"
          >
            <div class="text-lg">
              {{ data.roundNumber }}
            </div>
            <div class="text-sm text-gray">
              {{ data.phase }}
            </div>
          </div>
          <button
            class="btn btn-green-500"
            v-if="clickable.includes(DECLARE_END_ID)"
            @click="entityClicked(0)"
          >
            结束回合
          </button>
        </div>
      </div>
    </div>
    <div
      class="absolute right-0 top-0 w-40 h-full z-10 opacity-80 items-center justify-center bg-yellow-300 flex flex-col transition-all"
      :class="{ 'no-width': !showCardDropDiv }"
      @dragenter="myDiceDragenterHandler"
      @dragover="myDiceDragoverHandler"
      @dragleave="myDiceDragleaveHandler"
      @drop="myDiceDropHandler"
    >
      <span>拖动到此处</span>
      <span>以元素调和</span>
    </div>
    <div
      class="absolute right-0 top-0 h-full min-w-8 flex flex-col bg-yellow-800"
    >
      <SelectDice
        v-if="selectDiceOpt.enabled"
        class="h-full"
        :dice="myDice"
        :required="selectDiceOpt.required"
        :disableOk="selectDiceOpt.disableOk"
        :disableCancel="selectDiceOpt.disableCancel"
        :disableOmni="selectDiceOpt.disableOmni"
        @selected="player.diceSelected($event)"
        @cancelled="player.diceSelected(false)"
      ></SelectDice>
      <div v-else>
        <Dice v-for="d of myDice" :value="d"></Dice>
      </div>
    </div>
    <RollDice
      v-if="view === 'reroll'"
      class="absolute h-full w-full top-0 left-0 bg-black bg-opacity-70 z-20"
      :dice="data.players[who].dice"
      @selected="player.rerolled($event)"
    >
    </RollDice>
    <SwitchHands
      v-if="view === 'switchHands'"
      class="absolute h-full w-full top-0 left-0 bg-black bg-opacity-70 z-20"
      :hands="data.players[who].hands"
      @selected="player.handSwitched($event)"
    ></SwitchHands>
  </div>
</template>

<style>
.no-width {
  visibility: hidden;
  width: 0;
}
</style>
