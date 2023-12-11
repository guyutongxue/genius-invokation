<script lang="ts" setup>
import { StateData } from "@gi-tcg/typings";

import PlayerArea from "./PlayerArea.vue";
import { Player } from "../player";
import SkillButton from "./SkillButton.vue";
import { computed, ref, watch } from "vue";
import { initiativeSkillData } from "../static_data";

const props = defineProps<{
  player: Player;
}>();

const emit = defineEmits<{
  click: [id: number];
}>();

const who = props.player.who;
const data = props.player.state;
const outlined = props.player.outlined;
const selected = props.player.selected;

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
</script>

<template>
  <div
    v-if="data"
    class="w-full b-solid b-black b-2 flex relative"
    :class="who === 0 ? 'flex-col-reverse' : 'flex-col'"
  >
    <PlayerArea
      :data="data.players[0]"
      :opp="who !== 0"
      :outlined="outlined"
      :selected="selected"
      @click="emit('click', $event)"
    ></PlayerArea>
    <div class="bg-yellow-100">
      round = {{ data.roundNumber }};
      <!-- -->
      phase = {{ data.phase }};
      <!-- -->
      turn = {{ data.currentTurn }} ({{
        data.currentTurn === who ? "me" : "opp"
      }})
    </div>
    <PlayerArea
      :data="data.players[1]"
      :opp="who !== 1"
      :outlined="outlined"
      :selected="selected"
      @click="emit('click', $event)"
    ></PlayerArea>
    <div class="absolute right-10 bottom-0 flex flex-row gap-1">
      <SkillButton
        v-for="id of skillList"
        :id="id"
        :enabled="outlined.includes(id)"
      ></SkillButton>
    </div>
  </div>
</template>
