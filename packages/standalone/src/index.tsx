/* @refresh reload */
import "core-js";
import { render } from "solid-js/web";

import "./index.css";
import { App } from "./App";

render(() => <App />, document.getElementById("root")!);
