<script lang="ts" setup>
import { ref, watch } from "vue";
import db from "@genshin-db/tcg/src/min/data.min.json";
import Image from "./Image.vue";
import { getCharacter, getCard, CharacterTag } from "@gi-tcg/data";

export interface Deck {
  characters: number[];
  piles: number[];
}

const props = defineProps<{
  initialDeck?: Deck;
}>();

const emit = defineEmits<{
  (e: "submit", data: Deck): void;
  (e: "cancel"): void;
}>();

const deckCharacters = ref<(number | null)[]>(
  props.initialDeck ? props.initialDeck.characters : [null, null, null],
);
const deckActions = ref<(number | null)[]>(
  props.initialDeck ? props.initialDeck.piles : new Array(30).fill(null),
);

const allCharacters: { id: number; name: string }[] = Object.values(
  db.data.ChineseSimplified.tcgcharactercards,
).sort((a, b) => a.id - b.id);
const allActions: { id: number; name: string }[] = Object.values(
  db.data.ChineseSimplified.tcgactioncards,
).sort((a, b) => a.id - b.id);

function addCharacter(id: number) {
  const index = deckCharacters.value.findIndex((x) => x === null);
  if (index === -1) {
    alert("出战牌组角色牌已满");
    return;
  }
  deckCharacters.value[index] = id;
}

function removeCharacter(index: number) {
  deckCharacters.value[index] = null;
}

function addAction(id: number) {
  const index = deckActions.value.findIndex((x) => x === null);
  if (index === -1) {
    alert("出战牌组行动牌已满");
    return;
  }
  deckActions.value[index] = id;
  sort();
}

function removeAction(index: number) {
  deckActions.value[index] = null;
  sort();
}

function sort() {
  deckActions.value.sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });
}

function actionCardCount(id: number) {
  return deckActions.value.filter((x) => x === id).length;
}

function verify() {
  const chTags: CharacterTag[] = [];
  for (const ch of deckCharacters.value) {
    if (ch === null) {
      return "出战牌组角色牌未满";
    }
    if ([...new Set(deckCharacters.value)].length < 3) {
      return "出战牌组角色牌有重复";
    }
    try {
      const { tags } = getCharacter(ch);
      chTags.push(...tags);
    } catch (e) {
      return `角色牌 ${ch} 不存在`;
    }
  }
  for (const ac of deckActions.value) {
    if (ac === null) {
      return "出战牌组行动牌未满";
    }
    if (actionCardCount(ac) > 2) {
      return `行动牌 ${ac} 超过 2 张`;
    }
    try {
      const { showWhen } = getCard(ac);
      if (showWhen === true) continue;
      if (showWhen === false) {
        return `行动牌 ${ac} 不可用`;
      }
      if ("requiredDualCharacterTag" in showWhen) {
        const tag = showWhen.requiredDualCharacterTag;
        if (chTags.filter((x) => x === tag).length < 2) {
          return `行动牌 ${ac} 需要 2 个以上的 ${tag} 角色`;
        }
      } else {
        const reqCh = showWhen.requiredCharacter;
        if (!deckCharacters.value.includes(reqCh)) {
          return `行动牌 ${ac} 需要 ${reqCh} 角色`;
        }
      }
    } catch (e) {
      return `行动牌 ${ac} 不存在`;
    }
  }
  return null;
}

function submit() {
  const verifyResult = verify();
  if (verifyResult !== null) {
    alert(verifyResult);
    return;
  }
  emit("submit", {
    characters: deckCharacters.value as number[],
    piles: deckActions.value as number[],
  });
}

function manual() {
  const data = prompt("输入牌组数据");
  if (data === null) return;
  try {
    const { characters, piles } = JSON.parse(data);
    deckCharacters.value = characters;
    deckActions.value = piles;
  } catch (e) {
    alert("数据格式错误");
  }
}

async function toJson() {
  await navigator.clipboard.writeText(
    JSON.stringify({
      characters: deckCharacters.value,
      piles: deckActions.value,
    }),
  );
  alert("已复制到剪贴板");
}
</script>

<template>
  <div class="flex flex-col gap-2 w-full h-full">
    <div class="flex-grow flex flex-row gap-2">
      <div
        class="flex flex-shrink-0 flex-col items-center justify-center gap-2"
      >
        <h3 class="text-lg my-2 text-center">出战牌组</h3>
        <div class="flex flex-row gap-2">
          <div
            v-for="(ch, i) of deckCharacters"
            @click="removeCharacter(i)"
            :class="{ 'cursor-pointer': ch !== null }"
          >
            <Image type="card" :id="ch" :height="100" />
          </div>
        </div>
        <div class="grid grid-cols-6 gap-2">
          <div
            v-for="(ac, i) of deckActions"
            @click="removeAction(i)"
            :class="{ 'cursor-pointer': ac !== null }"
          >
            <Image type="card" :id="ac" :height="70" />
          </div>
        </div>
      </div>
      <div
        class="flex flex-grow flex-col ml-2 pl-4 border-l border-l-black p-2 justify-center gap-2"
      >
        <h3 class="text-lg my-2 text-center">牌库</h3>
        <div class="clear-left collapse collapse-arrow bg-base-200">
          <input type="radio" name="casket-1" checked />
          <div class="collapse-title">角色牌</div>
          <div class="collapse-content">
            <div class="h-[50vh] overflow-auto">
              <div
                v-for="{ id, name } of allCharacters"
                class="float-left m-1 cursor-pointer"
                :key="id"
                :title="name"
                @click="addCharacter(id)"
              >
                <Image type="card" :id="id" :width="60" />
              </div>
            </div>
          </div>
        </div>
        <div class="clear-left collapse collapse-arrow bg-base-200">
          <input type="radio" name="casket-1" />
          <div class="collapse-title">行动牌</div>
          <div class="collapse-content">
            <div class="h-[50vh] overflow-auto">
              <div
                v-for="{ id, name } of allActions"
                class="float-left m-1 cursor-pointer"
                :key="id"
                :title="name"
                @click="addAction(id)"
              >
                <Image type="card" :id="id" :width="60" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-center gap-2">
      <button class="btn btn-primary" @click="submit">保存</button>
      <button class="btn" @click="manual">导入...</button>
      <button class="btn" @click="toJson">导出</button>
      <button class="btn btn-error" @click="$emit('cancel')">取消</button>
    </div>
  </div>
</template>
