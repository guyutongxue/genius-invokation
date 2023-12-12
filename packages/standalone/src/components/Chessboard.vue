<script lang="ts" setup>
import { DiceType, StateData } from "@gi-tcg/typings";
import { flip } from "@gi-tcg/utils";

import PlayerArea from "./PlayerArea.vue";
import { Player } from "../player";
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
  canDeclareEnd,
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
</script>

<template>
  <div v-if="data" class="w-full b-solid b-black b-2 relative">
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
        <div class="flex items-center">
          <div
            class="w-20 h-20 rounded-10 flex flex-col items-center justify-center"
            :class="{
              'bg-yellow': data.currentTurn === who,
              'bg-lightblue': data.currentTurn !== who,
            }"
          >
            <div class="text-lg">
              {{ data.roundNumber }}
            </div>
            <div class="text-sm text-gray">
              {{ data.phase }}
            </div>
          </div>
          <button v-if="canDeclareEnd">结束回合</button>
        </div>
      </div>
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
  </div>
</template>
