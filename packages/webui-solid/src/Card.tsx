import type { CardData } from "@gi-tcg/typings";
import clsx from "clsx";

import "./Card.css";

import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { usePlayerContext } from "./Chessboard";

export interface CardProps {
  data: CardData;
}
export function Card(props: CardProps) {
  const { allClickable, allSelected } = usePlayerContext();
  const draggable = false; // TODO
  const selected = () => allSelected().includes(props.data.id);
  const clickable = () => allClickable().includes(props.data.id);
  return (
    <div class="card-wrapper">
      {props.data.definitionId > 0 ? (
        <div
          class={clsx("card relative", { selected: selected() })}
          // @click="clickable && emit('click', data.id)"
          // </div>@dragstart="dragstartHandler"
          // @dragend="dragendHandler"
          draggable={draggable}
        >
          <Image
            imageId={props.data.definitionId}
            class={clsx("h-full rounded-lg shadow-lg", {
              clickable: clickable(),
            })}
            title={`id = ${props.data.id}`}
          />
          <DiceCost
            class="absolute left-0 top-0 translate-x-[-50%] flex flex-col"
            cost={props.data.definitionCost}
          />
        </div>
      ) : (
        <div class="h-full aspect-[7/12] rotated flex items-center justify-center bg-gray-600 b-gray-700 b-solid b-4 color-white rounded" />
      )}
    </div>
  );
}
