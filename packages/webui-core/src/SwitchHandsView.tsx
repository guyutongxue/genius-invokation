import type { CardData } from "@gi-tcg/core";
import { For, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Card } from "./Card";

export interface SwitchHandsViewProps {
  hands: readonly CardData[];
  onConfirm?: (ids: number[]) => void;
}

export function SwitchHandsView(props: SwitchHandsViewProps) {
  const [chosenIds, setChosenIds] = createStore<number[]>([]);
  return (
    <div class="w-full h-full flex flex-col justify-center items-center">
      <ul class="flex gap-4">
        <For each={props.hands}>
          {(card) => (
            <li
              class="relative cursor-pointer h-30"
              onClick={() =>
                chosenIds.includes(card.id)
                  ? setChosenIds(chosenIds.filter((x) => x !== card.id))
                  : setChosenIds([...chosenIds, card.id])
              }
            >
              <Card data={card} />
              <Show when={chosenIds.includes(card.id)}>
                <div class="absolute top-[50%] left-0 w-full text-center text-7xl font-bold text-red-600 translate-y-[-50%]">
                  &#8856;
                </div>
              </Show>
            </li>
          )}
        </For>
      </ul>
      <button
        class="mt-3 btn btn-green"
        onClick={() => props.onConfirm && props.onConfirm(chosenIds)}
      >
        确定
      </button>
    </div>
  );
}
