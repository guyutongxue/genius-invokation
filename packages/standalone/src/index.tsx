/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import { App } from "./App";

(async () => {
  if (import.meta.env.PROD) {
    await import("core-js");
  }
  const root = document.getElementById("root")!;
  root.innerHTML = "";
  render(() => <App />, root);
})();
