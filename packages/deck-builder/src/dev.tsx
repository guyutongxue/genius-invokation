import { render } from "solid-js/web";
import { DeckBuilder } from ".";
import type { Deck } from "@gi-tcg/utils";
import { createEffect, createSignal } from "solid-js";

const EMPTY_DECK: Deck = {
  characters: [],
  cards: [],
};

function App() {
  const [deck, setDeck] = createSignal<Deck>(EMPTY_DECK);
  createEffect(() => {
    console.log(deck());
  });
  return (
    <DeckBuilder
      class="w-[100vw] h-[100vh]"
      deck={deck()}
      onChangeDeck={setDeck}
    />
  );
}

render(() => <App />, document.getElementById("root")!);
