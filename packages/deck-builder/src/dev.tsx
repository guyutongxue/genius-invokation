import { render } from "solid-js/web";
import { DeckBuilder } from ".";

function App() {
  return <DeckBuilder class="w-[100vw] h-[100vh]" />
}

render(() => <App />, document.getElementById("root")!);
