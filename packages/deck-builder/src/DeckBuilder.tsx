import { JSX, createContext, splitProps, useContext, Accessor } from "solid-js";
import { AllCards } from "./AllCards";
import { CurrentDeck } from "./CurrentDeck";

export interface DeckBuilderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  assetApiEndpoint?: string;
}

interface DeckBuilderContextValue {
  assetApiEndpoint: Accessor<string>;
}

const DeckBuilderContext = createContext<DeckBuilderContextValue>();

export const useDeckBuilderContext = () => useContext(DeckBuilderContext)!;

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
      <div class={`flex flex-row items-stretch gap-3 ${local.class}`} {...rest}>
        <AllCards />
        <div class="b-r-1 b-gray" />
        <div />
        <CurrentDeck />
      </div>
    </DeckBuilderContext.Provider>
  );
}
