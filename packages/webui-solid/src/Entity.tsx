import type { EntityData } from "@gi-tcg/typings";

export interface EntityProps {
  data: EntityData;
}

export function Summon(props: EntityProps) {
  return <div></div>;
}

export { Summon as Support };

export function Status(props: EntityProps) {
  return <div></div>;
}
