# Web 用户界面核心（Solid 实现）

## 使用方法

```tsx
import { createPlayer } from "@gi-tcg/webui-core";

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
