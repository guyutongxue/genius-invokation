import type { PlayerData } from "@gi-tcg/typings";
import { For, Match, Switch } from "solid-js";

import { Summon, Support, Status } from "./Entity";
import { CharacterArea } from "./CharacterArea";
import { Card } from "./Card";

export interface PlayerAreaProps {
  data: PlayerData;
  opp: boolean;
}

export function PlayerArea(props: PlayerAreaProps) {
  return (
    <div class="w-full flex flex-row">
      <div class="bg-yellow-800 text-white flex items-center w-10 flex-shrink-0">
        piles = {props.data.piles.length}
      </div>
      <div
        class={`flex-grow flex gap-6 ${
          props.opp ? "flex-col-reverse" : "flex-col"
        }`}
      >
        <div class="h-52 flex flex-row justify-center gap-6">
          <div class="min-w-40 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
            <For each={props.data.supports}>
              {(support) => <Support data={support} />}
            </For>
          </div>
          <div class="flex flex-row gap-6 items-end">
            <For each={props.data.characters}>
              {(ch) => (
                <div class="flex flex-col">
                  <CharacterArea data={ch} />
                  <Switch>
                    <Match when={ch.id === props.data.activeCharacterId}>
                      <div class="h-6 flex flex-row">
                        <For each={props.data.combatStatuses}>
                          {(st) => <Status data={st} />}
                        </For>
                      </div>
                    </Match>
                    <Match when={props.opp}>
                      <div class="h-12" />
                    </Match>
                  </Switch>
                </div>
              )}
            </For>
          </div>
          <div class="min-w-40 grid grid-cols-2 grid-rows-2 gap-2 justify-items-center items-center">
            <For each={props.data.summons}>
              {(summon) => <Summon data={summon} />}
            </For>
          </div>
        </div>
        <div
          class={`relative h-30 flex flex-row mx-4 hands-area ${
            props.opp ? "justify-end" : "justify-start"
          }`}
        >
          <For each={props.data.hands}>{(card) => <Card data={card} />}</For>
        </div>
      </div>
    </div>
  );
}
