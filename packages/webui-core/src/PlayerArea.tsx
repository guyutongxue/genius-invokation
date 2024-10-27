// Copyright (C) 2024 Guyutongxue
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
// 
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

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
      <div class="bg-yellow-800 text-white flex flex-col justify-center items-center w-10 flex-shrink-0 gap-2">
        <div class="text-center">牌堆 <br />{props.data.pile.length}</div>
        <div class="h-3 w-3 rotate-45 bg-gradient-to-r from-purple-500 to-blue-500" classList={{
          "bg-gradient-to-r": !props.data.legendUsed,
          "bg-gray-300": props.data.legendUsed,
        }} />
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
