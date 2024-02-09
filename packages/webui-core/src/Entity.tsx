import type { EntityData } from "@gi-tcg/typings";
import { Image } from "./Image";
import { Show } from "solid-js";
import { usePlayerContext } from "./Chessboard";
import { Interactable } from "./Interactable";

export interface EntityProps {
  data: EntityData;
}

export function Summon(props: EntityProps) {
  return (
    <Interactable
      class="relative h-15 w-15 rounded-lg"
      id={props.data.id}
      definitionId={props.data.definitionId}
    >
      <Image
        imageId={props.data.definitionId}
        class="h-full w-full rounded-lg"
      />
      <Show when={props.data.variable !== null}>
        <div class="absolute right-0 top-0 bg-white b-1 b-solid b-black w-6 h-6 rounded-3 translate-x-[50%] translate-y-[-50%] flex justify-center items-center">
          {props.data.variable}
        </div>
      </Show>
      <Show when={props.data.hintIcon !== null}>
        <div class="absolute h-5 min-w-0 left-0 bottom-0 bg-white bg-opacity-70 flex items-center">
          <Image
            imageId={props.data.hintIcon!}
            class="h-4 w-4 left-0 bottom-0"
          />
          { props.data.hintText }
        </div>
      </Show>
    </Interactable>
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
