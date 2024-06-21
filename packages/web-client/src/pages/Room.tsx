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
import { RpcMethod } from "@gi-tcg/typings";

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
  method: RpcMethod;
  params: any;
}

export function Room() {
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const code = params.code;
  const action = !!searchParams.action;
  const userId = searchParams.user;
  const id = roomCodeToId(code);
  const [playerIo, setPlayerIo] = createSignal<PlayerIOWithCancellation>();
  const [initialized, setInitialized] = createSignal<InitializedPayload>();
  const [chessboard, setChessboard] = createSignal<JSX.Element>();

  const reportStreamError = async (e: Error) => {
    if (e instanceof AxiosError) {
      const data = e.response?.data as ReadableStream;
      if (data && "pipeThrough" in data) {
        const reader = data.pipeThrough(new TextDecoderStream()).getReader();
        const { value, done } = await reader.read();
        alert(JSON.parse(value ?? "{}").message);
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
      });
      setChessboard(<Ui />);
      setPlayerIo(io);
    }
  });

  const onActionRequested = async (payload: ActionRequestPayload) => {
    const response = await playerIo()?.rpc(payload.method, payload.params);
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
      <div class="container mx-auto">
        <h2 class="text-2xl font-bold">房间号：{code}</h2>
        {chessboard()}
      </div>
    </Layout>
  );
}
