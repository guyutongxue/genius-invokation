import type { CharacterData } from "@gi-tcg/typings";
import { Image } from "./Image";
import { Status } from "./Entity";
// import { usePlayerContext } from "./chessboard";
import { For, Index, Show } from "solid-js";
import { usePlayerContext } from "./Chessboard";

export interface CharacterAreaProps {
  data: CharacterData;
}

interface EnergyBarProps {
  current: number;
  total: number;
}

function EnergyBar(props: EnergyBarProps) {
  return (
    <div class="absolute z-10 right-[-10px] top-0 flex flex-col gap-2">
      <Index each={Array(props.total).fill(0)}>
        {(_, i) => (
          <svg // 能量点
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
          >
            <path
              d="M538.112 38.4c-15.36-44.544-39.936-44.544-55.296 0l-84.992 250.88c-14.848 44.544-64 93.184-108.032 108.544L40.448 482.816c-44.544 15.36-44.544 39.936 0 55.296l247.808 86.016c44.544 15.36 93.184 64.512 108.544 108.544l86.528 251.392c15.36 44.544 39.936 44.544 55.296 0l84.48-249.856c14.848-44.544 63.488-93.184 108.032-108.544l252.928-86.528c44.544-15.36 44.544-39.936 0-54.784l-248.832-83.968c-44.544-14.848-93.184-63.488-108.544-108.032-1.536-0.512-88.576-253.952-88.576-253.952z"
              fill={i < props.current ? "yellow" : "white"}
              stroke="black"
              stroke-width="40"
            />
          </svg>
        )}
      </Index>
    </div>
  );
}

function WaterDrop() {
  return (
    <svg // 水滴
      viewBox="0 0 1024 1024"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      width="30"
      height="40"
    >
      <path
        d="M926.2 609.8c0 227.2-187 414.2-414.2 414.2S97.8 837 97.8 609.8c0-226.2 173.3-395 295.7-552C423.5 19.3 467.8 0 512 0s88.5 19.3 118.5 57.8c122.4 157 295.7 325.8 295.7 552z"
        fill="#ffffff"
        stroke="black"
        stroke-width="30"
      />
    </svg>
  );
}

export function CharacterArea(props: CharacterAreaProps) {
  const { allSelected, allClickable, onClick } = usePlayerContext();
  const selected = () => allSelected.includes(props.data.id);
  const clickable = () => allClickable.includes(props.data.id);
  const aura1 = () => props.data.aura & 0xf;
  const aura2 = () => (props.data.aura >> 4) & 0xf;
  return (
    <div class="flex flex-col gap-1 items-center">
      <div class="h-5 flex flex-row items-end gap-2">
        <Show when={aura1()}>
          <Image imageId={aura1()} class="h-5 w-5" />
        </Show>
        <Show when={aura2()}>
          <Image imageId={aura2()} class="h-5 w-5" />
        </Show>
      </div>
      <div class="h-40 relative" title={`id=${props.data.id}`}>
        <div class="absolute z-10 left-[-15px] top-[-20px] flex items-center justify-center">
          <WaterDrop />
          <div class="absolute">{props.data.health}</div>
        </div>
        <EnergyBar current={props.data.energy} total={props.data.maxEnergy} />
        <Image
          imageId={props.data.definitionId}
          class="h-full rounded-xl"
          classList={{
            "brightness-50": props.data.defeated,
            clickable: clickable(),
            selected: selected(),
          }}
          onClick={() => clickable() && onClick(props.data.id)}
        />
        <div class="absolute left-0 bottom-0 h-6 flex flex-row">
          <For each={props.data.entities}>{(st) => <Status data={st} />}</For>
        </div>
        <Show when={props.data.defeated}>
          <div class="absolute z-10 top-[50%] left-0 w-full text-center text-5xl font-bold translate-y-[-50%] font-[var(--font-emoji)]">
            &#9760;
          </div>
        </Show>
      </div>
    </div>
  );
}
