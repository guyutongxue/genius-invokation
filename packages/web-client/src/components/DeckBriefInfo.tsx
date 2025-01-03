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
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import { useLocation, useNavigate } from "@solidjs/router";
import axios, { AxiosError } from "axios";
import { For, Show } from "solid-js";
import { DEFAULT_ASSET_API_ENDPOINT } from "@gi-tcg/config";
import { DeckInfo } from "../pages/Decks";
import { useGuestDecks, useGuestInfo } from "../guest";

export interface DeckInfoProps extends DeckInfo {
  editable?: boolean;
  onDelete?: () => void;
}

export function DeckBriefInfo(props: DeckInfoProps) {
  const navigate = useNavigate();
  const guestInfo = useGuestInfo();
  const [, { removeGuestDeck }] = useGuestDecks();

  const viewDeck = (e: MouseEvent) => {
    e.stopPropagation();
    navigate(`/decks/${props.id}?name=${encodeURIComponent(props.name)}`);
  };

  const copyCode = async (e: MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(props.code);
    alert(`已复制分享码：${props.code}`);
  };

  const deleteDeck = async (e: MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定要删除牌组 ${props.name} 吗？`)) {
      try {
        if (guestInfo()) {
          await removeGuestDeck(props.id);
        } else {
          await axios.delete(`decks/${props.id}`);
        }
        props.onDelete?.();
      } catch (e) {
        if (e instanceof AxiosError) {
          alert(e.response?.data.message);
        }
        console.error(e);
      }
    }
  };

  return (
    <div
      class="w-60 bg-yellow-800 hover:bg-yellow-700 transition-all flex flex-col p-2 rounded-xl select-none cursor-default"
      onClick={viewDeck}
    >
      <div class="pl-2 flex flex-row justify-between">
        <h5 class="font-bold text-yellow-100 overflow-hidden whitespace-nowrap text-ellipsis">
          {props.name}
        </h5>
        <div class="flex-shrink-0">
          <button class="btn btn-ghost" title="复制分享码" onClick={copyCode}>
            <i class="i-mdi-clipboard-outline" />
          </button>
          <Show when={props.editable}>
            <button
              class="btn btn-ghost-red"
              title="删除牌组"
              onClick={deleteDeck}
            >
              <i class="i-mdi-delete" />
            </button>
          </Show>
        </div>
      </div>
      <div class="p-2 flex flex-row items-center justify-around">
        <For each={props.characters}>
          {(id) => (
            <img
              class="h-14 w-14 b-2 b-yellow-100 rounded-full"
              src={`${DEFAULT_ASSET_API_ENDPOINT}/images/character_icons/${id}`}
            />
          )}
        </For>
      </div>
    </div>
  );
}
