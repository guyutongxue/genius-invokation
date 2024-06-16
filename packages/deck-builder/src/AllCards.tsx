import { For, createSignal } from "solid-js";
import {
  T as tagMap,
  Y as typeMap,
  c as characters,
  a as actionCards,
} from "./data.json" /*  with { type: "json" } */;
import { useDeckBuilderContext } from "./DeckBuilder";
import { Card } from "./Card";

const CHARACTER_ELEMENT_TYPES = {
  1: tagMap.indexOf("GCG_TAG_ELEMENT_CRYO"),
  2: tagMap.indexOf("GCG_TAG_ELEMENT_HYDRO"),
  3: tagMap.indexOf("GCG_TAG_ELEMENT_PYRO"),
  4: tagMap.indexOf("GCG_TAG_ELEMENT_ELECTRO"),
  5: tagMap.indexOf("GCG_TAG_ELEMENT_ANEMO"),
  6: tagMap.indexOf("GCG_TAG_ELEMENT_GEO"),
  7: tagMap.indexOf("GCG_TAG_ELEMENT_DENDRO"),
};

const CHARACTER_ELEMENT_NAME = {
  1: "冰",
  2: "水",
  3: "火",
  4: "雷",
  5: "风",
  6: "岩",
  7: "草",
} as Record<number, string>;

export function AllCharacterCards() {
  const { assetApiEndpoint } = useDeckBuilderContext();
  const [chTag, setChTag] = createSignal<number | null>(0);
  const filtered = () => {
    const tag = chTag();
    if (tag === null) {
      return characters;
    }
    return characters.filter((ch) => ch.t.includes(tag));
  };

  const toggleChTag = (tagIdx: number) => {
    if (chTag() === tagIdx) {
      setChTag(null);
    } else {
      setChTag(tagIdx);
    }
  };
  return (
    <div class="h-full flex flex-col">
      <div class="flex flex-row gap-1 mb-2">
        <For each={Object.entries(CHARACTER_ELEMENT_TYPES)}>
          {([imgIdx, tagIdx]) => (
            <button
              onClick={() => toggleChTag(tagIdx)}
              data-selected={chTag() === tagIdx}
              class="data-[selected=true]:bg-black w-5 h-5"
            >
              <img
                src={`${assetApiEndpoint()}/images/${imgIdx}?thumb=1`}
                alt={CHARACTER_ELEMENT_NAME[Number(imgIdx)]}
              />
            </button>
          )}
        </For>
      </div>
      <ul class="flex-grow overflow-auto flex flex-row flex-wrap gap-2">
        <For each={filtered()}>
          {(ch) => (
            <li>
              <Card id={ch.i} name={ch.n} />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

const AC_TYPE_TEXT = {
  [typeMap.indexOf("GCG_CARD_MODIFY")]: {
    name: "装备牌",
    tags: {
      [tagMap.indexOf("GCG_TAG_WEAPON")]: "武器",
      [tagMap.indexOf("GCG_TAG_WEAPON_BOW")]: "弓",
      [tagMap.indexOf("GCG_TAG_WEAPON_SWORD")]: "单手剑",
      [tagMap.indexOf("GCG_TAG_WEAPON_CLAYMORE")]: "双手剑",
      [tagMap.indexOf("GCG_TAG_WEAPON_POLE")]: "长柄武器",
      [tagMap.indexOf("GCG_TAG_WEAPON_CATALYST")]: "法器",
      [tagMap.indexOf("GCG_TAG_ARTIFACT")]: "圣遗物",
      [tagMap.indexOf("GCG_TAG_TALENT")]: "天赋",
    },
  },
  [typeMap.indexOf("GCG_CARD_EVENT")]: {
    name: "事件牌",
    tags: {
      [tagMap.indexOf("GCG_TAG_LEGEND")]: "秘传",
      [tagMap.indexOf("GCG_TAG_FOOD")]: "食物",
      [tagMap.indexOf("GCG_TAG_RESONANCE")]: "元素共鸣",
      [tagMap.indexOf("GCG_TAG_TALENT")]: "天赋",
    },
  },
  [typeMap.indexOf("GCG_CARD_ASSIST")]: {
    name: "支援牌",
    tags: {
      [tagMap.indexOf("GCG_TAG_PLACE")]: "场地",
      [tagMap.indexOf("GCG_TAG_ALLY")]: "伙伴",
      [tagMap.indexOf("GCG_TAG_ITEM")]: "道具",
    },
  },
};

export function AllActionCards() {
  const { assetApiEndpoint } = useDeckBuilderContext();
  const [acType, setAcType] = createSignal<number>(0);
  const [acTag, setAcTag] = createSignal<string>("");

  const availableTags = () => AC_TYPE_TEXT[acType()].tags;

  const filtered = () => {
    const ty = acType();
    const tag = acTag();
    return actionCards.filter(
      (ac) =>
        (ty === null || ac.y === ty) &&
        (tag === "" || ac.t.includes(Number(tag))),
    );
  };
  return (
    <div class="h-full flex flex-col">
      <div class="flex flex-row gap-2 mb-2">
        <For each={Object.keys(AC_TYPE_TEXT)}>
          {(ty, i) => (
            <button
              onClick={() => (setAcType(i()), setAcTag(""))}
              data-selected={acType() === i()}
              class="flex-shrink-0 data-[selected=true]:font-bold"
            >
              {AC_TYPE_TEXT[Number(ty)].name}
            </button>
          )}
        </For>
        <select
          class="flex-grow border-black border-1px"
          value={acTag()}
          onChange={(e) => setAcTag(e.target.value)}
        >
          <option value="">不限标签</option>
          <For each={Object.keys(availableTags())}>
            {(tag) => <option value={tag}>{availableTags()[Number(tag)]}</option>}
          </For>
        </select>
      </div>
      <ul class="flex-grow overflow-auto flex flex-row flex-wrap gap-2">
        <For each={filtered()}>
          {(ac) => (
            <li>
              <Card id={ac.i} name={ac.n} />
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

export function AllCards() {
  const [tab, setTab] = createSignal(0);
  return (
    <div class="w-[calc(50%-12px)] h-full flex flex-col min-h-0">
      <ul class="flex flex-row gap-2 mb-2">
        <li>
          <button
            class="data-[active=true]:font-bold"
            onClick={() => setTab(0)}
            data-active={tab() === 0}
          >
            角色牌
          </button>
        </li>
        <li>
          <button
            class="data-[active=true]:font-bold"
            onClick={() => setTab(1)}
            data-active={tab() === 1}
          >
            行动牌
          </button>
        </li>
      </ul>
      <div class="min-h-0">
        <div
          data-visible={tab() === 0}
          class="h-full hidden data-[visible=true]:block"
        >
          <AllCharacterCards />
        </div>
        <div
          data-visible={tab() === 1}
          class="h-full hidden data-[visible=true]:block"
        >
          <AllActionCards />
        </div>
      </div>
    </div>
  );
}
