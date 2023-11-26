<script lang="ts" setup>
import { PlayerData } from "@gi-tcg/typings";
import CharacterArea from "./CharacterArea.vue";
import Summon from "./Summon.vue";
import Support from "./Support.vue";
import Card from "./Card.vue";
import Dice from "./Dice.vue";

const props = defineProps<{
  data: PlayerData;
}>();
</script>

<template>
  <div class="flex flex-row">
    <div>{{ data.piles.length }}</div>
    <div class="flex flex-col">
      <div class="flex flex-row">
        <div>
          <Support
            v-for="support of data.supports"
            :key="support.id"
            :data="support"
          ></Support>
        </div>
        <div>
          <CharacterArea
            v-for="ch of data.characters"
            :key="ch.id"
          ></CharacterArea>
        </div>
        <div>
          <Summon
            v-for="summon of data.summons"
            :key="summon.id"
            :data="summon"
          ></Summon>
        </div>
      </div>
      <div class="flex flex-row">
        <Card v-for="card of data.hands" :key="card.id" :data="card"></Card>
      </div>
    </div>
    <div>
      <Dice v-for="d of data.dice" :value="d"></Dice>
    </div>
  </div>
</template>
