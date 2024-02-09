import { Show } from "solid-js";

export type TypeKey =
  | "tcgcharactercards"
  | "tcgactioncards"
  | "tcgsummons"
  | "tcgstatuseffects"
  | "tcgkeywords";

export interface CardDescrptionProps {
  show: boolean;
  id: number;
  type: TypeKey;
  x: number;
  y: number;
  z: number;
}

export function CardDescription(props: CardDescrptionProps) {
  return (
    <Show when={props.show}>
      <div
        class="absolute w-30 h-30 bg-white rounded-5"
        style={{
          left: `${props.x}px`,
          top: `${props.y}px`,
          "z-index": props.z,
        }}
      >
        test {props.id}
      </div>
    </Show>
  );
}
