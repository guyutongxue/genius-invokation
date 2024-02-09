import type { CardData, DiceType } from "@gi-tcg/typings";

import "./Card.css";

import { Image } from "./Image";
import { DiceCost } from "./DiceCost";
import { ELEMENTAL_TUNING_OFFSET, usePlayerContext } from "./Chessboard";
import { Show } from "solid-js";
import { Interactable } from "./Interactable";

export interface CardProps {
  data: CardData;
  realCost?: DiceType[];
}

export function Card(props: CardProps) {
  const { allCosts } = usePlayerContext();
  const realCost = () => allCosts[props.data.id];
  return (
    <div class="card-wrapper">
      <Show
        when={props.data.definitionId > 0}
        fallback={
          <div class="h-full aspect-[7/12] rotated flex items-center justify-center bg-gray-600 b-gray-700 b-solid b-4 color-white rounded" />
        }
      >
        <Interactable
          class="card relative rotated rounded-lg"
          id={props.data.id}
          definitionId={props.data.definitionId}
        >
          <Image
            imageId={props.data.definitionId}
            class="h-full rounded-lg shadow-lg"
            title={`id = ${props.data.id}`}
          />
          <DiceCost
            class="absolute left-0 top-0 translate-x-[-50%] flex flex-col"
            cost={props.data.definitionCost}
            realCost={realCost()}
          />
        </Interactable>
      </Show>
    </div>
  );
}
