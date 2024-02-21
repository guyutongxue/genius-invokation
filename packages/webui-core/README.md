# `@gi-tcg/webui-core` Web UI Core for Genius Invokation

> **Warning**
>
> This package is not designed for public use yet. You should make `solid-js` as a peer dependency to render things exported from this package. For more common scenario, use `@gi-tcg/webui` package instead.  
> This is an ESM-only package.  
> If you're using `tsc` and `moduleResolution: "Node16"`, enable `skipLibCheck: true`. We cannot make typings compatible with `Node16` for now.

## Usage

```tsx
import { createPlayer } from "@gi-tcg/webui-core";
import "@gi-tcg/webui-core/style.css";

function App() {
  const [io0, Chessboard0] = createPlayer(0);
  const [io1, Chessboard1] = createPlayer(1);

  const io: GameIO = {
    pause: /* ... */,
    players: [io0, io1],
  };
  const game = new Game({ data, io, playerConfigs });
  
  onMounted(() => {
    game.start();
  })

  return (
    <>
      <Chessboard0 />
      <Chessboard1 />
    </>
  );
}
```
