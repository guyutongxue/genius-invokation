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

import { createSignal, createResource, Switch, Match, Show } from "solid-js";
import { Layout } from "../layouts/Layout";
import axios, { AxiosError } from "axios";
import { decode, encode, type Deck } from "@gi-tcg/utils";
import {
  A,
  useBeforeLeave,
  useNavigate,
  useParams,
  useSearchParams,
} from "@solidjs/router";
import { DeckBuilder } from "@gi-tcg/deck-builder";
import "@gi-tcg/deck-builder/style.css";

export function EditDeck() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isNew = params.id === "new";
  const deckId = Number(params.id);
  const navigate = useNavigate();
  const [deckName, setDeckName] = createSignal<string>(
    searchParams.name ?? "新建牌组",
  );
  const [deckNameInput, setDeckNameInput] = createSignal<string>("");
  const [editingName, setEditingName] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [uploadDone, setUploadDone] = createSignal(false);
  const [deckValue, setDeckValue] = createSignal<Deck>({
    characters: [],
    cards: [],
  });
  const [deckData] = createResource(async () => {
    if (isNew) {
      return true;
    }
    const { data } = await axios.get(`decks/${deckId}`);
    setDeckValue(data);
    setDeckName(data.name);
    setSearchParams({ name: null });
    return data;
  });
  const [dirty, setDirty] = createSignal(false);
  useBeforeLeave(async (e) => {
    if (dirty()) {
      e.preventDefault();
      if (window.confirm("您有未保存的更改，是否保存？")) {
        if (await saveDeck()) {
          e.retry(true);
        }
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

  const startEditingName = () => {
    setDeckNameInput(deckName());
    setEditingName(true);
  };

  const saveName = async (newName: string) => {
    const oldName = deckName();
    if (!isNew) {
      try {
        setUploading(true);
        await axios.patch(`decks/${deckId}`, { name: newName });
        setDeckName(newName);
        setEditingName(false);
      } catch (e) {
        if (e instanceof AxiosError) {
          alert(e.response?.data.message);
          setDeckName(oldName);
        }
        console.error(e);
      } finally {
        setUploading(false);
      }
    } else {
      setDeckName(newName);
      setEditingName(false);
    }
  };

  const saveDeck = async () => {
    const deck = deckValue();
    try {
      setUploading(true);
      if (isNew) {
        const { data } = await axios.post("decks", {
          ...deck,
          name: deckName(),
        });
        setDirty(false);
        navigate(`../${data.id}`);
      } else {
        await axios.patch(`decks/${deckId}`, { ...deck });
        setDirty(false);
        setUploadDone(true);
        setTimeout(() => setUploadDone(false), 500);
      }
      return true;
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
      return false;
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div class="container mx-auto h-full flex flex-col min-h-0">
        <div class="flex-shrink-0 flex flex-row gap-3 mb-5 min-h-0">
          <Show
            when={editingName()}
            fallback={
              <>
                <h2 class="text-2xl font-bold">{deckName()}</h2>
                <button class="btn btn-ghost" onClick={startEditingName}>
                  <i class="i-mdi-pencil-outline" />
                </button>
                <button class="btn btn-outline-blue" onClick={importCode}>
                  导入分享码
                </button>
                <button class="btn btn-outline" onClick={exportCode}>
                  生成分享码
                </button>
                <button
                  class="btn btn-solid-green min-w-22"
                  disabled={!valid() || uploading()}
                  onClick={saveDeck}
                >
                  <Switch>
                    <Match when={uploading()}>
                      <i class="i-mdi-loading animate-spin" />
                    </Match>
                    <Match when={uploadDone()}>
                      <i class="i-mdi-check" />
                    </Match>
                    <Match when={true}>保存牌组</Match>
                  </Switch>
                </button>
              </>
            }
          >
            <input
              class="input input-outline w-50 h-8"
              value={deckNameInput()}
              onInput={(e) => setDeckNameInput(e.currentTarget.value)}
            />
            <button
              class="btn btn-ghost-green min-w-12"
              disabled={uploading()}
              onClick={() => saveName(deckNameInput())}
            >
              <Show when={uploading()} fallback="保存">
                <i class="i-mdi-loading animate-spin" />
              </Show>
            </button>
            <button
              class="btn btn-ghost-red"
              onClick={() => setEditingName(false)}
            >
              取消
            </button>
          </Show>
          <span class="flex-grow" />
          <A class="btn btn-ghost-blue" href="..">
            返回牌组列表
          </A>
        </div>
        <Switch>
          <Match when={deckData.loading}>正在加载中...</Match>
          <Match when={deckData.error}>加载失败，请刷新页面重试</Match>
          <Match when={true}>
            <DeckBuilder
              class="min-h-0 h-full w-full"
              deck={deckValue()}
              onChangeDeck={(v) => (setDeckValue(v), setDirty(true))}
            />
          </Match>
        </Switch>
      </div>
    </Layout>
  );
}
