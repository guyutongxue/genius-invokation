import { StatusFacade } from "@jenshin-tcg/typings";
import { Status } from "./character";

export function flip(x: 0 | 1): 0 | 1 {
  return (1 - x) as 0 | 1;
}
