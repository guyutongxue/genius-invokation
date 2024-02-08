import type { CardData, DiceType } from "@gi-tcg/typings";

import "./Card.css";

import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { ELEMENTAL_TUNING_OFFSET, usePlayerContext } from "./Chessboard";
import { Show } from "solid-js";

export interface CardProps {
  data: CardData;
  realCost?: DiceType[];
}

export function Card(props: CardProps) {
  const { allClickable, allSelected, allCosts, onClick, setPrepareTuning } =
    usePlayerContext();
  const draggable = () =>
    allClickable.includes(props.data.id + ELEMENTAL_TUNING_OFFSET);
  const selected = () => allSelected.includes(props.data.id);
  const clickable = () => allClickable.includes(props.data.id);
  const realCost = () => allCosts[props.data.id];

  const dragStart = (e: DragEvent) => {
    e.dataTransfer!.setData("text/plain", props.data.id.toString());
    setPrepareTuning(true);
  };
  const dragEnd = () => {
    setPrepareTuning(false);
  };

  return (
    <div class="card-wrapper">
      <Show
        when={props.data.definitionId > 0}
        fallback={
          <div class="h-full aspect-[7/12] rotated flex items-center justify-center bg-gray-600 b-gray-700 b-solid b-4 color-white rounded" />
        }
      >
        <div
          class="card relative rotated"
          classList={{ selected: selected() }}
          onClick={() => clickable() && onClick(props.data.id)}
          draggable={draggable()}
          onDragStart={dragStart}
          onDragEnd={dragEnd}
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
