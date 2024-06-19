import type { Deck } from "@gi-tcg/utils";
import { A } from "@solidjs/router";
import { For } from "solid-js";

export interface DeckBriefInfo extends Deck {
  name: string;
  code: string;
  id: number;
  sinceVersion: string;
}

export function DeckBriefInfo(props: DeckBriefInfo) {
  return (
    <A href={`/decks/${props.id}?name=${encodeURIComponent(props.name)}`} class="bg-yellow-800 hover:bg-yellow-700 transition-all flex flex-col p-4 pt-2 gap-2 rounded-xl">
      <h5 class="font-bold text-yellow-100">{props.name}</h5>
      <div class="flex flex-row gap-3 items-center justify-center">
        <For each={props.characters}>
          {(id) => (
            <img
              class="h-14 w-14 b-2 b-yellow-100 rounded-full"
              src={`https://gi-tcg-assets.guyutongxue.site/api/v2/images/character_icons/${id}`}
            />
          )}
        </For>
      </div>
    </A>
  );
}
