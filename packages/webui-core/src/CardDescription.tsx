import { ComponentProps, Show, splitProps } from "solid-js";
import { usePlayerContext } from "./Chessboard";

export type TypeKey =
  | "tcgcharactercards"
  | "tcgactioncards"
  | "tcgsummons"
  | "tcgstatuseffects"
  | "tcgkeywords";

export interface CardDescrptionProps extends ComponentProps<"div"> {
  definitionId: number;
  type?: TypeKey;
}

export function CardDescription(props: CardDescrptionProps) {
  const [local, rest] = splitProps(props, ["definitionId", "type"]);
  return (
    <div {...rest}>
      <div class="w-30 h-30 rounded-md bg-white cursor-auto">
        test {local.definitionId}
      </div>
    </div>
  );
}

export interface RootCardDescriptionProps {
  show: boolean;
  id: number;
  definitionId: number;
  x: number;
  y: number;
}
