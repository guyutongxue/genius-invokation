import {
  type JSX,
  createContext,
  splitProps,
  useContext,
  type Accessor,
} from "solid-js";
import { AllCards } from "./AllCards";
import { CurrentDeck } from "./CurrentDeck";
import type { Deck } from "@gi-tcg/utils";

export interface DeckBuilderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  assetApiEndpoint?: string;
  deck?: Deck;
  onChangeDeck?: (deck: Deck) => void;
}

interface DeckBuilderContextValue {
  assetApiEndpoint: Accessor<string>;
}

const DeckBuilderContext = createContext<DeckBuilderContextValue>();

export const useDeckBuilderContext = () => useContext(DeckBuilderContext)!;

const EMPTY_DECK: Deck = {
  characters: [],
  cards: [],
};

export function DeckBuilder(props: DeckBuilderProps) {
  const [local, rest] = splitProps(props, ["assetApiEndpoint", "class"]);
  return (
    <DeckBuilderContext.Provider
      value={{
        assetApiEndpoint: () =>
          local.assetApiEndpoint ??
          "https://gi-tcg-assets.guyutongxue.site/api/v2",
      }}
    >
      <div class={`gi-tcg-deck-builder ${local.class}`}>
        <div
          class="w-full h-full flex flex-row items-stretch gap-3 select-none"
          {...rest}
        >
          <AllCards
            deck={props.deck ?? EMPTY_DECK}
            onChangeDeck={props.onChangeDeck}
          />
          <div class="b-r-1 b-gray" />
          <div />
          <CurrentDeck
            deck={props.deck ?? EMPTY_DECK}
            onChangeDeck={props.onChangeDeck}
          />
        </div>
      </div>
    </DeckBuilderContext.Provider>
  );
}
