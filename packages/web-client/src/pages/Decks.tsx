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

import {
  For,
  Match,
  Switch,
  createResource,
  ResourceReturn,
} from "solid-js";
import { Layout } from "../layouts/Layout";
import axios from "axios";
import { A } from "@solidjs/router";
import { DeckBriefInfo } from "../components/DeckBriefInfo";
import { Deck } from "@gi-tcg/utils";
import { useGuestDecks, useGuestInfo } from "../guest";

export interface DeckInfo extends Deck {
  id: number;
  name: string;
  code: string;
  requiredVersion: number;
}

interface DecksResponse {
  count: number;
  data: DeckInfo[];
}

export function useDecks(): ResourceReturn<DecksResponse> {
  const guestInfo = useGuestInfo();
  const [guestDeck] = useGuestDecks();
  return createResource(() => {
    if (guestInfo()) {
      const data = guestDeck();
      return {
        data,
        count: data.length,
      };
    } else {
      return axios.get<DecksResponse>("decks").then((res) => res.data);
    }
  });
}

export function Decks() {
  const [decks, { refetch }] = useDecks();
  return (
    <Layout>
      <div class="container mx-auto">
        <div class="flex flex-row gap-4 items-center mb-5">
          <h2 class="text-2xl font-bold">我的牌组</h2>
          <A class="btn btn-outline-green" href="/decks/new">
            <i class="i-mdi-plus" /> 添加
          </A>
        </div>
        <Switch>
          <Match when={decks.loading}>正在加载中...</Match>
          <Match when={decks.error}>加载失败，请刷新页面重试</Match>
          <Match when={decks()}>
            {(decks) => (
              <ul class="flex flex-row flex-wrap gap-3">
                <For
                  each={decks().data}
                  fallback={
                    <li class="p-4 text-gray-5">暂无牌组，可点击 + 添加</li>
                  }
                >
                  {(deckData) => (
                    <DeckBriefInfo
                      editable
                      onDelete={() => refetch()}
                      {...deckData}
                    />
                  )}
                </For>
              </ul>
            )}
          </Match>
        </Switch>
      </div>
    </Layout>
  );
}
