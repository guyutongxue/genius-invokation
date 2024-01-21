# Web 用户界面核心（Solid 实现）

## 使用方法

```tsx
import { createPlayer, createWaitNotify } from "@gi-tcg/webui-solid";

function App() {
  const [io0, Chessboard0] = createPlayer(0);
  const [io1, Chessboard1] = createPlayer(1);

  const [pausing, pause, resume] = createWaitNotify();

  const io: GameIO = {
    pause,
    players: [io0, io1],
  };
  startGame({
    data,
    io,
    playerConfigs: [playerConfig0, playerConfig1],
  });

  return (
    <>
      <button disabled={!pausing()} onClick={resume}>
        Step
      </button>
      <Chessboard0 />
      <Chessboard1 />
    </>
  );
}
```
