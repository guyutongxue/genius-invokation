# 开发说明

本项目目前使用 monorepo 划分和管理包，共有如下包：

- **核心部分**
  - `@gi-tcg/core` 核心逻辑与游戏流程
  - `@gi-tcg/data` 官方卡牌数据表示
- **界面部分**
  - `@gi-tcg/webui-core` 基于 Solid 的 Web 用户界面组件
  - `@gi-tcg/standalone` 用于调试的集成 Web 用户界面
- **其它**
  - `@gi-tcg/typings` 定义基本数据类型前后端通信格式
  - `@gi-tcg/utils` 实用工具集合

## 使用接口

核心库暴露了 `startGame` 函数以启动一个对局。其传入的参数大致为：

```ts
interface StartOption {
  data: ReadonlyDataStore; // import('@gi-tcg/data') 即是
  playerConfigs: [PlayerConfig, PlayerConfig];
  io: GameIO; // see below
}

interface PlayerConfig {
  readonly cards: number[];
  readonly characters: number[];
}
```

大部分字段都是显然的。

- 玩家分别是 0 号玩家和 1 号玩家，0 号玩家总是先手（使用方负责猜先的实现）。每个玩家的 `PlayerConfig` 通常只需指明其角色牌 `characters` 和行动牌 `cards`。
- `data` 如果使用官方卡牌数据，可直接 `import data from "@gi-tcg/data";`。
- `io` 定义了玩家的交互行为。

```ts
interface GameIO {
  pause: (st: GameState) => Promise<unknown>;
  players: [PlayerIO, PlayerIO];
}

interface PlayerIO {
  giveUp: boolean;
  notify: (notification: NotificationMessage) => void;
  rpc: <M extends RpcMethod>(
    method: M,
    data: RpcRequest[M],
  ) => Promise<RpcResponse[M]>;
}
```

玩家的交互行为在 `io.players` 中定义。其中：
- 若设置 `giveUp` 为 `true`，则在下个“结算点”处，游戏自动判负；
- 在合理的时机游戏会调用玩家的 `notify` 函数以通知玩家有某些牌局的变化；
- 在需要玩家操作（指重投骰子、切换手牌、选择出战角色、选择行动）的时刻，会调用 `rpc` 获取玩家的选择。也可通过实现此接口接入 AI 智能体。

关于玩家 IO 的详细说明，参见 [io](./io.md)。

每次对局进行到一个“结算点”处，就会调用一次 `pause`，方便使用方调试。

## 数据定义

本项目力求最佳的开发体验，因此定义卡牌数据被设计为“应当”非常简单的操作。参阅 [data](./data/README.md)。

## 设计细节

在阅读源码之前，可以先参阅本项目的[核心数据结构](./state.md)和[结算流程设计](./process.md)。
