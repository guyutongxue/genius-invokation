# `@gi-tcg/webui` Web UI for Genius Invokation

## Usage

```js
// Inject a player chessboard with IO
const io0 = createPlayer(document.querySelector("#player0"), 0);

// Acquire a show-only standalone chessboard (using Web Component)
const chessboard = document.createElement("gi-tcg-standalone-chessboard");
chessboard.stateData = /* ... */;
document.body.append(chessboard);
```
