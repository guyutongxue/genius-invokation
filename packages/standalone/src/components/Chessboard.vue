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
    (ch) => ch.id === player.activeCharacterId
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

function myDiceDragenterHandler(e: DragEvent) {
  e.preventDefault();
  (e.target! as HTMLElement).classList.add("dropping");
}
function myDiceDragoverHandler(e: DragEvent) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = "move";
}
function myDiceDragleaveHandler(e: DragEvent) {
  e.preventDefault();
  (e.target! as HTMLElement).classList.remove("dropping");
}
function myDiceDropHandler(e: DragEvent) {
  e.preventDefault();
  (e.target! as HTMLElement).classList.remove("dropping");
  const id = parseInt(e.dataTransfer!.getData("text/plain"));
  entityClicked(id + ELEMENTAL_TUNING_OFFSET);
}
</script>

<template>
  <div v-if="data" class="w-full b-solid b-black b-2 relative select-none">
    <div
      class="h-full w-full flex relative pr-8"
      :class="who === 0 ? 'flex-col-reverse' : 'flex-col'"
    >
      <PlayerArea
        :data="data.players[0]"
        :opp="who !== 0"
        :clickable="clickable"
        :selected="selected"
        @click="entityClicked($event)"
      ></PlayerArea>
      <PlayerArea
        :data="data.players[1]"
        :opp="who !== 1"
        :clickable="clickable"
        :selected="selected"
        @click="entityClicked($event)"
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
      class="absolute right-0 top-0 h-full min-w-8 flex flex-col bg-yellow-800"
      @dragenter="myDiceDragenterHandler"
      @dragover="myDiceDragoverHandler"
      @dragleave="myDiceDragleaveHandler"
      @drop="myDiceDropHandler"
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
  </div>
</template>

<style>
.dropping {
  min-width: 4rem;
}

.dropping::after {
  content: "（元素调和）";
  color: white;
  white-space: pre-wrap;
}
</style>
