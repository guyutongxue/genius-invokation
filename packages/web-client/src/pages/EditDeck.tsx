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

import { createSignal, createResource, Switch, Match } from "solid-js";
import { Layout } from "../layouts/Layout";
import axios, { AxiosError } from "axios";
import { decode, encode, type Deck } from "@gi-tcg/utils";
import { A, useBeforeLeave, useNavigate, useParams } from "@solidjs/router";
import { SizedDeckBuilder } from "../components/SizedDeckBuilder";

export function EditDeck() {
  const params = useParams();
  const isNew = params.id === "new";
  const deckId = Number(params.id);
  const navigate = useNavigate();
  const [deckName, setDeckName] = createSignal<string>("新建牌组");
  const [deckValue, setDeckValue] = createSignal<Deck>({
    characters: [],
    cards: [],
  });
  const [deckData, { refetch }] = createResource(async () => {
    if (isNew) {
      return true;
    }
    const { data } = await axios.get(`decks/${deckId}`);
    setDeckValue(data);
    setDeckName(data.name);
    return data;
  });
  const [dirty, setDirty] = createSignal(false);
  useBeforeLeave((e) => {
    if (dirty()) {
      e.preventDefault();
      if (window.confirm("您有未保存的更改，确定要离开吗？")) {
        e.retry(true);
      }
    }
  });

  const valid = () => {
    const deck = deckValue();
    return deck.characters.length === 3 && deck.cards.length === 30;
  };

  const importCode = () => {
    const input = window.prompt("请输入分享码");
    if (input === null) {
      return;
    }
    try {
      const deck = decode(input);
      setDeckValue(deck);
    } catch (e) {
      if (e instanceof Error) {
        window.alert(e.message);
      }
      console.error(e);
    }
  };

  const exportCode = async () => {
    try {
      const deck = deckValue();
      const code = encode(deck);
      await navigator.clipboard.writeText(code);
      alert(`分享码已复制到剪贴板：${code}`);
    } catch (e) {
      if (e instanceof Error) {
        window.alert(e.message);
      }
      console.error(e);
    }
  };

  const saveDeck = async () => {
    const deck = deckValue();
    try {
      await axios.post("decks", { ...deck, name: deckName() });
      navigate(`..`);
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
    }
  };
  return (
    <Layout>
      <div class="container mx-auto h-full flex flex-col">
        <Switch>
          <Match when={deckData.loading}>正在加载中...</Match>
          <Match when={deckData.error}>加载失败，请刷新页面重试</Match>
          <Match when={true}>
            <div class="flex-shrink-0 flex flex-row gap-3 mb-5">
              <h2 class="text-2xl font-bold">{deckName()}</h2>
              <button class="btn btn-outline-blue" onClick={importCode}>
                导入分享码
              </button>
              <button class="btn btn-outline" onClick={exportCode}>
                生成分享码
              </button>
              <button
                class="btn btn-solid-green"
                disabled={!valid()}
                onClick={saveDeck}
              >
                保存牌组
              </button>
              <span class="flex-grow" />
              <A class="btn btn-ghost-blue" href="..">
                返回牌组列表
              </A>
            </div>
            <SizedDeckBuilder
              deck={deckValue()}
              onChangeDeck={(v) => (setDeckValue(v), setDirty(true))}
            />
          </Match>
        </Switch>
      </div>
    </Layout>
  );
}
