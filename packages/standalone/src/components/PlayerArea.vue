<script lang="ts" setup>
import { PlayerData } from "@gi-tcg/typings";
import CharacterArea from "./CharacterArea.vue";
import Summon from "./Summon.vue";
import Support from "./Support.vue";
import Card from "./Card.vue";
import Dice from "./Dice.vue";
import Status from "./Status.vue";

const props = defineProps<{
  data: PlayerData;
  opp?: boolean;
  outlined: number[];
  selected: number[];
}>();

const emit = defineEmits<{
  click: [id: number];
}>();
</script>

<template>
  <div class="w-full flex flex-row">
    <div class="bg-yellow-800 text-white">piles = {{ data.piles.length }}</div>
    <div
      class="flex-grow flex gap-2"
      :class="opp ? 'flex-col-reverse' : 'flex-col'"
    >
      <div class="min-h-58 flex flex-row justify-center gap-6">
        <div class="min-w-40">
          <Support
            v-for="support of data.supports"
            :key="support.id"
            :data="support"
            :outlined="outlined.includes(support.id)"
            :selected="selected.includes(support.id)"
            @click="emit('click', $event)"
          ></Support>
        </div>
        <div class="flex flex-row gap-6 items-end">
          <div v-for="ch of data.characters" class="flex flex-col">
            <CharacterArea
              :key="ch.id"
              :data="ch"
              :outlined="outlined.includes(ch.id)"
              :selected="selected.includes(ch.id)"
              @click="emit('click', $event)"
            ></CharacterArea>
            <div v-if="ch.id === data.activeCharacterId" class="h-6">
              <Status v-for="st of data.combatStatuses" :data="st"></Status>
            </div>
            <div v-else-if="opp" class="h-12"></div>
          </div>
        </div>
        <div class="min-w-40">
          <Summon
            v-for="summon of data.summons"
            :key="summon.id"
            :data="summon"
            :outlined="outlined.includes(summon.id)"
            :selected="selected.includes(summon.id)"
            @click="emit('click', $event)"
          ></Summon>
        </div>
      </div>
      <div
        class="min-h-30 mx-2 flex flex-row gap-2"
        :class="opp ? 'justify-end' : 'justify-start'"
      >
        <Card
          v-for="card of data.hands"
          :key="card.id"
          :data="card"
          :outlined="outlined.includes(card.id)"
          :selected="selected.includes(card.id)"
          @click="emit('click', $event)"
        ></Card>
      </div>
    </div>
    <div v-if="opp" class="w-8 bg-yellow-800 text-white">
      oppDice = {{ data.dice.length }}
    </div>
    <div v-else class="w-8 flex flex-col bg-yellow-800">
      <Dice v-for="d of data.dice" :value="d"></Dice>
    </div>
  </div>
</template>
