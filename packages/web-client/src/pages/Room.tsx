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

import { useParams, useSearchParams } from "@solidjs/router";
import { Layout } from "../layouts/Layout";
import { roomCodeToId } from "../utils";
import { useUserContext } from "../App";
import { Show, createSignal, onMount, JSX, createEffect } from "solid-js";
import axios, { AxiosError } from "axios";
import { Dynamic } from "solid-js/web";
import { PlayerIOWithCancellation, createPlayer } from "@gi-tcg/webui-core";
import "@gi-tcg/webui-core/style.css";
import type { Deck } from "@gi-tcg/utils";
import EventSourceStream from "@server-sent-stream/web";
import { RpcMethod, RpcRequest } from "@gi-tcg/typings";
import { BACKEND_BASE_URL } from "../config";

interface InitializedPayload {
  who: 0 | 1;
  oppPlayerInfo: {
    userId: number;
    userName: string;
    deck: Deck;
  };
}

interface ActionRequestPayload {
  id: number;
  timeout: number;
  request: RpcRequest;
}

const names: Record<number, string> = {};
(async () => {
  const { default: data } = await import("../names.json");
  Object.assign(names, data);
})();

export function Room() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const code = params.code;
  const action = !!searchParams.action;
  const userId = searchParams.user;
  const id = roomCodeToId(code);
  const [playerIo, setPlayerIo] = createSignal<PlayerIOWithCancellation>();
  const [initialized, setInitialized] = createSignal<InitializedPayload>();
  const [loading, setLoading] = createSignal(true);
  const [failed, setFailed] = createSignal(false);
  const [chessboard, setChessboard] = createSignal<JSX.Element>();

  const reportStreamError = async (e: Error) => {
    if (e instanceof AxiosError) {
      const data = e.response?.data as ReadableStream;
      if (data && "pipeThrough" in data) {
        const reader = data.pipeThrough(new TextDecoderStream()).getReader();
        const { value, done } = await reader.read();
        if (initialized()) {
          alert(JSON.parse(value ?? "{}").message);
        } else {
          setFailed(true);
        }
        console.error(value);
      }
    }
    console.error(e);
  };

  createEffect(() => {
    const payload = initialized();
    if (payload) {
      const [io, Ui] = createPlayer(payload.who, {
        onGiveUp: async () => {
          try {
            const { data } = await axios.post(
              `rooms/${id}/players/${userId}/giveUp`,
            );
          } catch (e) {
            if (e instanceof AxiosError) {
              alert(e.response?.data.message);
            }
            console.error(e);
          }
        },
        assetAltText: (id) => names[id]
      });
      setChessboard(<Ui />);
      setPlayerIo(io);
    }
  });

  const onActionRequested = async (payload: ActionRequestPayload) => {
    playerIo()?.cancelRpc();
    await new Promise((r) => setTimeout(r, 100)); // wait for UI notifications?
    const response = await playerIo()?.rpc(payload.request);
    try {
      const { data } = await axios.post(
        `rooms/${id}/players/${userId}/actionResponse`,
        {
          id: payload.id,
          response,
        },
      );
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
    }
  };

  const deleteRoom = async () => {
    if (!window.confirm(`确认删除房间吗？`)) {
      return;
    }
    try {
      const { data } = await axios.delete(`rooms/${id}`);
      history.back();
    } catch (e) {
      if (e instanceof AxiosError) {
        alert(e.response?.data.message);
      }
      console.error(e);
    }
  };

  onMount(() => {
    axios
      .get(`rooms/${id}/players/${userId}/notification`, {
        headers: {
          Accept: "text/event-stream",
        },
        responseType: "stream",
        adapter: "fetch",
      })
      .then(async (response) => {
        console.log("notification CONNECTED");
        const data: ReadableStream = response.data;
        const reader = data.pipeThrough(new EventSourceStream()).getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          const payload = JSON.parse(value.data);
          setLoading(false);
          switch (payload.type) {
            case "initialized": {
              setInitialized(payload);
              break;
            }
            case "notification": {
              playerIo()?.notify(payload.data);
              break;
            }
            default: {
              console.log("%c%s", "color: green", value.data);
              break;
            }
          }
        }
      })
      .catch(reportStreamError);
    if (action) {
      axios
        .get(`rooms/${id}/players/${userId}/actionRequest`, {
          headers: {
            Accept: "text/event-stream",
          },
          responseType: "stream",
          adapter: "fetch",
        })
        .then(async (response) => {
          console.log("actionRequest CONNECTED");
          const data: ReadableStream = response.data;
          const reader = data.pipeThrough(new EventSourceStream()).getReader();
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              break;
            }
            const payload = JSON.parse(value.data);
            switch (payload.type) {
              case "rpc": {
                onActionRequested(payload);
                break;
              }
              default: {
                console.log("%c%s", "color: red", value.data);
                break;
              }
            }
          }
        })
        .catch(reportStreamError);
    }
  });
  return (
    <Layout>
      <div class="container mx-auto flex flex-col">
        <div class="flex flex-row gap-3 items-center mb-3">
          <h2 class="text-2xl font-bold">房间号：{code}</h2>
          <Show when={!loading() && !failed() && !initialized()}>
            <button class="btn btn-outline-red" onClick={deleteRoom}>
              <i class="i-mdi-delete" />
            </button>
          </Show>
        </div>
        <Show when={!failed()} fallback={<div>加载房间失败！</div>}>
          <Show when={initialized()} fallback={<div>等待对手加入房间…</div>}>
            {chessboard()}
          </Show>
        </Show>
      </div>
    </Layout>
  );
}
