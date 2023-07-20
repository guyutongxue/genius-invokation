# 开发相关

## 项目结构

项目整体使用 Pnpm Monorepo 组织，目前共有如下包：

- `@gi-tcg/core`：核心库，包括游戏流程和游戏逻辑
- `@gi-tcg/typings`：类型与类型检查库
- `@gi-tcg/data`：卡牌数据
- `@gi-tcg/standalone`：（暂时）基于 Vue 的前端界面

`core`、`typings`、`data` 被设计为前后端通用。

所有的库都使用 ESM 接口。

## 整体进行逻辑

`core` 包的 `Game` 类指代一场对局。创建 `Game` 对象后，调用 `registerPlayer` 方法来添加玩家。

`PlayerConfig` 指代一个玩家的配置信息，包括如何交互等。其 `deck` 属性指明卡组，`handler` 属性指明如何响应时间请求，`onNotify` 回调函数会在游戏状态更新时调用。

调用 `registerPlayer` 后，可以得到一个 `GameController`，玩家调用其中的 `ready` 已表明准备好开始游戏。

## 玩家的 `handler`

```ts
function handler<M extends RpcMethod>(method: M, request: RpcRequest[M]) => Promise<RpcResponse[M]>;
```

游戏过程中会在需要玩家操作的时候调用 `handler`，前端需要给出相应的反馈。目前的调用场合是：

| `M`            | 含义                 |
| -------------- | -------------------- |
| `switchHands`  | 请求更换手牌         |
| `rerollDice`   | 请求选择要重掷的骰子 |
| `chooseActive` | 请求选择出战角色     |
| `action`       | 请求行动             |

与传统的 C-S 架构不同，几乎所有通信都是服务器 `core` 主动发起的，所以若需要网络通信的话，应考虑 WebSocket。

## `onNotify` 回调

当有状态更新时，会调用玩家的 `onNotify` 回调。参数包括 `event` 和 `state`；其中 `state` 是新的状态数据（仅当前玩家可见的部分）。

`event` 指明一些可能不会更改状态数据，但是也有必要在前端显示的事件，如：
- 新的游戏阶段/行动轮/回合；
- 双方使用技能/卡牌/切人/宣布结束；
- 对方调和/更换手牌；（可考虑：我方的手牌更换也应该类似地有通知，以精细化动画）
- 造成伤害/治疗等。

## 暂时目录

- [事件](./events.md)
<!-- - [角色](./character.md)
- [手牌](./card.md)
- [状态与出战状态](./status.md)
- [通用数据描述](./data_desc.md) 数据描述的通用部分 -->
