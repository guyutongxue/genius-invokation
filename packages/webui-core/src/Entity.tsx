import type { EntityData } from "@gi-tcg/typings";
import { Image } from "./Image";
import { Show } from "solid-js";
import { usePlayerContext } from "./Chessboard";

export interface EntityProps {
  data: EntityData;
}

export function Summon(props: EntityProps) {
  const { allSelected, allClickable, focusing, onClick } = usePlayerContext();
  const selected = () => allSelected.includes(props.data.id);
  const clickable = () => allClickable.includes(props.data.id);
  const focused = () => focusing() === props.data.id;
  return (
    <div
      class="relative h-15 w-15"
      classList={{
        selected: selected(),
      }}
    >
      <Image
        imageId={props.data.definitionId}
        class="h-full w-full rounded-lg"
        classList={{
          clickable: clickable(),
          focused: focused(),
        }}
        onClick={() => clickable() && onClick(props.data.id)}
      />
      <Show when={props.data.variable !== null}>
        <div class="absolute right-0 top-0 bg-white b-1 b-solid b-black w-6 h-6 rounded-3 translate-x-[50%] translate-y-[-50%] flex justify-center items-center">
          {props.data.variable}
        </div>
      </Show>
    </div>
  );
}

export { Summon as Support };

export function Status(props: EntityProps) {
  const { focusing } = usePlayerContext();
  const focused = () => focusing() === props.data.id;
  return (
    <div class="relative w-5">
      <Image
        imageId={props.data.definitionId}
        class="h-5"
        classList={{
          focused: focused(),
        }}
      />
      <Show when={props.data.variable !== null}>
        <div class="absolute bottom-0 right-0 text-xs">
          {props.data.variable}
        </div>
      </Show>
    </div>
  );
}
