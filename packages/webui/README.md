# `@gi-tcg/webui` Web UI for Genius Invokation

> **Warning**
>
> This is an ESM-only package.  
> If you're using `tsc` and `moduleResolution: "Node16"`, enable `skipLibCheck: true`. We cannot make typings compatible with `Node16` for now.

## Usage

```js
import { createPlayer } from "@gi-tcg/webui";

// Inject a player chessboard with IO
const io0 = createPlayer(document.querySelector("#player0"), 0);

// Acquire a show-only standalone chessboard (using Web Component)
const chessboard = document.createElement("gi-tcg-standalone-chessboard");
chessboard.stateData = /* ... */;
document.body.append(chessboard);
```
