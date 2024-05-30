import { GameState } from "..";
import { DetailedEventArgOf, DetailedEventNames } from "./skill";

type ExtensionMethods = {
  [E in DetailedEventNames]?: (
    state: GameState,
    eventArg: DetailedEventArgOf<E>,
  ) => void;
};
