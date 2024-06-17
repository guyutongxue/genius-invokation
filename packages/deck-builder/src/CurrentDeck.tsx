import { For, Index, Show, createEffect } from "solid-js";
import type { AllCardsProps } from "./AllCards";
import { Card } from "./Card";
import {
  c as characters,
  a as actionCards,
} from "./data.json" /*  with { type: "json" } */;
import { createStore } from "solid-js/store";

type Character = (typeof characters)[0];
type ActionCard = (typeof actionCards)[0];

export function CurrentDeck(props: AllCardsProps) {
  const [currentChs, setCurrentChs] = createStore<(Character | null)[]>(
    Array.from({ length: 3 }, () => null),
  );
  const [currentAcs, setCurrentAcs] = createStore<(ActionCard | null)[]>(
    Array.from({ length: 30 }, () => null),
  );

  createEffect(() => {
    const selectedChs = props.deck.characters
      .map((id) => characters.find((ch) => ch.i === id))
      .filter((ch): ch is Character => typeof ch !== "undefined")
      .toSorted((a, b) => a.i - b.i);
    const selectedAcs = props.deck.cards
      .map((id) => actionCards.find((ac) => ac.i === id))
      .filter((ac): ac is ActionCard => typeof ac !== "undefined")
      .toSorted((a, b) => a.i - b.i);
    for (let i = 0; i < 3; i++) {
      setCurrentChs(i, selectedChs[i] ? { ...selectedChs[i] } : null);
    }
    for (let i = 0; i < 30; i++) {
      setCurrentAcs(i, selectedAcs[i] ? { ...selectedAcs[i] } : null);
    }
  });

  const removeCharacter = (idx: number) => {
    setCurrentChs(idx, null);
    props.onChangeDeck?.({
      ...props.deck,
      characters: currentChs
        .filter((ch): ch is Character => ch !== null)
        .map((ch) => ch.i),
    });
  };
  const removeActionCard = (idx: number) => {
    setCurrentAcs(idx, null);
    props.onChangeDeck?.({
      ...props.deck,
      cards: currentAcs
        .filter((ac): ac is ActionCard => ac !== null)
        .map((ac) => ac.i),
    });
  };

  return (
    <div class="flex-shrink-0 flex flex-col items-center justify-center gap-5">
      <div>
        <ul class="flex flex-row gap-3">
          <Index each={currentChs}>
            {(ch, idx) => (
              <li
                class="w-[80px] aspect-ratio-[7/12] relative group"
                onClick={() => ch() && removeCharacter(idx)}
              >
                <Show
                  when={ch()}
                  fallback={
                    <div class="w-full h-full rounded-lg bg-gray-200" />
                  }
                >
                  {(ch) => (
                    <>
                      <Card id={ch().i} name={ch().n} />
                      <div class="absolute left-1/2 top-1/2 translate-x--1/2 translate-y--1/2 text-2xl group-hover:block hidden">
                      &#10060;
                      </div>
                    </>
                  )}
                </Show>
              </li>
            )}
          </Index>
        </ul>
      </div>
      <div>
        <ul class="grid grid-cols-6 gap-2">
          <Index each={currentAcs}>
            {(ac, idx) => (
              <li
                class="w-[60px] aspect-ratio-[7/12] relative group"
                onClick={() => ac() && removeActionCard(idx)}
              >
                <Show
                  when={ac()}
                  fallback={
                    <div class="w-full h-full rounded-lg bg-gray-200" />
                  }
                >
                  {(ac) => (
                    <>
                      <Card id={ac().i} name={ac().n} />
                      <div class="absolute left-1/2 top-1/2 translate-x--1/2 translate-y--1/2 text-2xl group-hover:block hidden">
                      &#10060;
                      </div>
                    </>
                  )}
                </Show>
              </li>
            )}
          </Index>
        </ul>
      </div>
    </div>
  );
}
