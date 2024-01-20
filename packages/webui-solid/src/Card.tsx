import type { CardData, DiceType } from "@gi-tcg/typings";

import "./Card.css";

import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { usePlayerContext } from "./Chessboard";
import { Show } from "solid-js";

export interface CardProps {
  data: CardData;
  realCost?: DiceType[];
}

export function Card(props: CardProps) {
  const { allClickable, allSelected, allCosts, onClick } = usePlayerContext();
  const draggable = false; // TODO
  const selected = () => allSelected.includes(props.data.id);
  const clickable = () => allClickable.includes(props.data.id);
  const realCost = () => allCosts[props.data.id];
  return (
    <div class="card-wrapper">
      <Show
        when={props.data.definitionId > 0}
        fallback={
          <div class="h-full aspect-[7/12] rotated flex items-center justify-center bg-gray-600 b-gray-700 b-solid b-4 color-white rounded" />
        }
      >
        <div
          class="card relative"
          classList={{ selected: selected() }}
          onClick={() => clickable() && onClick(props.data.id)}
          // </div>@dragstart="dragstartHandler"
          // @dragend="dragendHandler"
          draggable={draggable}
        >
          <Image
            imageId={props.data.definitionId}
            class="h-full rounded-lg shadow-lg"
            classList={{ clickable: clickable() }}
            title={`id = ${props.data.id}`}
          />
          <DiceCost
            class="absolute left-0 top-0 translate-x-[-50%] flex flex-col"
            cost={props.data.definitionCost}
            realCost={realCost()}
          />
        </div>
      </Show>
    </div>
  );
}
