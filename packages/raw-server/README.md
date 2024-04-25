# `@gi-tcg/raw-server` 七圣召唤 HTTP 服务器包装

此包将 `@gi-tcg/core` `@gi-tcg/data` 包装为 HTTP 服务器，可编译为可执行文件，并与其它编程语言编写或运行在其它计算机上的程序使用 WebSocket/HTTP 交互。

> [!IMPORTANT]
> 此包仅用于计算机程序之间交互，并非作为真实游戏服务器使用；也未设计“房间”等概念，程序在同一时刻仅处理（模拟）一场对局


## API 文档

### WebSocket 端点 `/play`

向该端点建立 WebSocket 链接。随后使用 JSON-RPC 双向通信。客户端可以调用的方法：

- **方法：`ready`**
- 参数：`PlayerConfig`；额外附加两属性：  
  ```ts
  interface ReadyParam extends PlayerConfig {
    $who: 0 | 1;
    $useAgent?: "dumb" | null;
  }
  ```
- 含义：玩家 `$who` 已准备好接受并响应数据。`$useAgent` 代表此玩家使用内置 Agent 操作，不再进行通信。目前的内置 Agent 实现有：
  - `dumb`——愚蠢的 Agent：总是宣布结束；不换牌；不重投骰子；出战角色总是选择首个。 
  - 或许未来会有更多 Agent 的实现。
- 成功返回结果：`0`。

-----

- **方法：`giveUp`**
- 参数：`{ $who: 0 | 1 }`。
- 含义：玩家 `$who` 放弃对局。
- 成功返回结果：`0`。

-----

目前服务器会调用玩家的方法有：

- **通知：`notify`**（不含 `id`，不可回复）
- 参数：`NotificationMessage`；附加属性 `{ $who: 0 | 1 }`。
- 含义：通知玩家 `$who` 发生对局变化。

-----

- **方法：`rerollDice` / `switchHands` / `chooseActive` / `action`**
- 参数：`RpcRequest[M]`，`M` 为方法名；附加属性 `{ $who: 0 | 1 }`。
- 含义：获取玩家 `$who` 的行动。
- 成功返回结果：`RpcResponse[M]`，`M` 为方法名。

### Web UI 显示

为方便观察对局，可通过浏览器访问 `/?who=0` 或 `/?who=1` 观察对应玩家的对局数据。

