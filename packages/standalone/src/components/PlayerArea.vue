<script lang="ts" setup>
import { PlayerData } from "@gi-tcg/typings";
import CharacterArea from "./CharacterArea.vue";
import Summon from "./Summon.vue";
import Support from "./Support.vue";
import Card from "./Card.vue";
import Dice from "./Dice.vue";
import Status from "./Status.vue";
import { ELEMENTAL_TUNING_OFFSET } from "../player";

const props = defineProps<{
  data: PlayerData;
  opp?: boolean;
  clickable: number[];
  selected: number[];
}>();

const emit = defineEmits<{
  click: [id: number];
  cardDragstart: [id: number];
  cardDragend: [id: number];
}>();
</script>

<template>
  <div class="w-full flex flex-row">
    <div class="bg-yellow-800 text-white flex items-center w-10 flex-shrink-0">
      piles = {{ data.piles.length }}
    </div>
    <div
      class="flex-grow flex gap-6"
      :class="opp ? 'flex-col-reverse' : 'flex-col'"
    >
      <div class="h-52 flex flex-row justify-center gap-6">
        <div class="min-w-40">
          <Support
            v-for="support of data.supports"
            :key="support.id"
            :data="support"
            :clickable="clickable.includes(support.id)"
            :selected="selected.includes(support.id)"
            @click="emit('click', $event)"
          ></Support>
        </div>
        <div class="flex flex-row gap-6 items-end">
          <div v-for="ch of data.characters" class="flex flex-col">
            <CharacterArea
              :key="ch.id"
              :data="ch"
              :clickable="clickable.includes(ch.id)"
              :selected="selected.includes(ch.id)"
              @click="emit('click', $event)"
            ></CharacterArea>
            <div v-if="ch.id === data.activeCharacterId" class="h-6 flex flex-row">
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
            :clickable="clickable.includes(summon.id)"
            :selected="selected.includes(summon.id)"
            @click="emit('click', $event)"
          ></Summon>
        </div>
      </div>
      <div
        class="h-30 flex flex-row mx-4"
        :class="opp ? 'justify-end' : 'justify-start'"
      >
        <Card
          v-for="card of data.hands"
          :key="card.id"
          :data="card"
          :clickable="clickable.includes(card.id)"
          :draggable="clickable.includes(card.id + ELEMENTAL_TUNING_OFFSET)"
          :selected="selected.includes(card.id)"
          @click="emit('click', $event)"
          @dragstart="emit('cardDragstart', $event)"
          @dragend="emit('cardDragend', $event)"
        ></Card>
      </div>
    </div>
  </div>
</template>
