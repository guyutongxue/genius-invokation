import { For, Show } from "solid-js";
import { A } from "@solidjs/router";
import { useUserContext } from "../App";
import { roomIdToCode } from "../utils";

export interface RoomInfoProps {
  id: number;
  players: {
    userId: number;
    userName?: string;
  }[];
}

export function RoomInfo(props: RoomInfoProps) {
  const { user } = useUserContext();
  const insideRoom = () => props.players.some((p) => p.userId === user()?.id);
  const code = () => roomIdToCode(props.id);
  const url = (playerId: number) => {
    if (insideRoom()) {
      return `rooms/${code()}?user=${playerId}&action=1`;
    } else {
      return `rooms/${code()}?user=${playerId}`;
    }
  };
  return (
    <div class="w-90 bg-yellow-100 rounded-xl p-4">
      <h4 class="font-semibold">房间 {code()}</h4>
      <div class="flex flex-row justify-between">
        <Show when={props.players.length > 0}>
          <A href={url(props.players[0].userId)}>
            {props.players[0].userName ?? `旅行者 ${props.players[0].userId}`}
          </A>
          <span>VS</span>
          <Show when={props.players.length > 1} fallback={<div>???</div>}>
            <A href={url(props.players[1].userId)}>
              {props.players[1].userName ?? `旅行者 ${props.players[1].userId}`}
            </A>
          </Show>
        </Show>
      </div>
    </div>
  );
}
