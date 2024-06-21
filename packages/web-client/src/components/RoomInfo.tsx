import { For, Show, createResource } from "solid-js";
import { A } from "@solidjs/router";
import { useUserContext } from "../App";
import { getGravatarUrl, roomIdToCode } from "../utils";

export interface RoomInfoProps {
  id: number;
  players: {
    userId: number;
    userName?: string;
    userEmail: string;
  }[];
}

export function RoomInfo(props: RoomInfoProps) {
  const { user } = useUserContext();
  const insideRoom = () => props.players.some((p) => p.userId === user()?.id);
  const code = () => roomIdToCode(props.id);
  const url = (playerId: number) => {
    if (insideRoom()) {
      return `rooms/${code()}?user=${user()!.id}&action=1`;
    } else {
      return `rooms/${code()}?user=${playerId}`;
    }
  };
  const [avatarUrl0] = createResource(
    () => props.players,
    (players) => {
      return players[0] && getGravatarUrl(players[0].userEmail, 30);
    },
  );
  const [avatarUrl1] = createResource(
    () => props.players,
    (players) => {
      return players[1] && getGravatarUrl(players[1].userEmail, 30);
    },
  );
  return (
    <div class="w-90 bg-yellow-100 rounded-xl p-4">
      <h4 class="font-semibold mb-3">房间 {code()}</h4>
      <div class="flex flex-row justify-between items-center">
        <Show when={props.players.length > 0}>
          <A
            href={url(props.players[0].userId)}
            class="flex flex-row items-center h-6 rounded-r-xl pr-2 bg-yellow-800 text-yellow-100 ml-2"
          >
            <img src={avatarUrl0()} class="rounded-full b-yellow-800 b-1 translate-x--2" />
            {props.players[0].userName ?? `旅行者 ${props.players[0].userId}`}
          </A>
          <span class="text-xl font-bold">VS</span>
          <Show when={props.players.length > 1} fallback={<div>???</div>}>
            <A
              href={url(props.players[1].userId)}
              class="flex flex-row items-center h-6 rounded-l-xl pl-2 bg-yellow-800 text-yellow-100 mr-2"
            >
              {props.players[1].userName ?? `旅行者 ${props.players[1].userId}`}
              <img src={avatarUrl1()} class="rounded-full b-yellow-800 b-1 translate-x-2" />
            </A>
          </Show>
        </Show>
      </div>
    </div>
  );
}
