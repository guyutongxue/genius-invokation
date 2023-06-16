# 开发相关

## 项目结构

项目整体使用 Pnpm Monorepo 组织，目前共有如下包：

- `@jenshin-tcg/core`：核心库，包括游戏流程和游戏逻辑
- `@jenshin-tcg/typings`：类型与类型检查库
- `@jenshin-tcg/data`：卡牌数据
- `@jenshin-tcg/web`：（考虑重命名）基于 Vue 的前端界面

`core`、`typings`、`data` 被设计为前后端通用。

所有的库都使用 ESM 接口。

## 整体进行逻辑

一次游戏流程由 `core` 库给出。通过给 `core` 库传入两个 `Player` 以开始游戏。

`Player` 内需要提供牌组信息和 `handler` 。后者是与前端交互用的。

```ts
function handler(method: M, param: RequestType<M>): Promise<ResonseType<M>>;
```

游戏过程中，`core` 会在需要的时候调用 `handler`，前端需要给出相应的反馈。目前的调用场合是：

| `M`            | 含义             |
| -------------- | ---------------- |
| `initialize`   | 初始化           |
| `drawHands`    | 已抽牌           |
| `removeHands`  | 请求换牌         |
| `roll`         | 已掷骰/请求重掷  |
| `switchActive` | 请求选择出战角色 |
| `action`       | 请求行动         |
| `notify`       | 其它通知         |

与传统的 C-S 架构不同，几乎所有通信都是服务器 `core` 主动发起的，所以若需要网络通信的话，应考虑 WebSocket。

## `notify` 通知与 `state` 更新

以该方法名调用时，会提供 `state`：这是前端需要显示的所有信息（类型 `StateFacade`）。

提供 `source`，即此次 `state` 更新的主动发起方是谁：

- `phaseBegin`：阶段开始，清除骰子/支援/召唤物、被动技能等
- `oppSwitchHands`：对方更改手牌（放回、抽取或者丢弃）
- `oppDeclareEnd`：对方宣布回合结束（其实不更改 `state`）
- `useSkill`：角色技能被发动
- `playCard`：手牌被打出
- `switchActive`：出战角色被更改
- `summon`：召唤物被使用（可用次数-1）
- `support`：场地支援被使用（可用次数-1）
- `status`：状态或出战状态被触发（可用次数-1）

可能提供 `damages`，用于显示本次 `state` 更新造成的伤害或治疗（用于给前端显示相关特效）。

但是并非所有 `state` 更新都会被 `notify`，由己方角色主动发起的更新不会有冗余的 `notify`，需要前端自行记录：

- 己方有手牌抽取（`M = drawHands`）
- 己方有手牌放回/更换（`M = removeHands`）
- 己方掷骰（`M = roll`）
- 己方被动选择出战角色（`M = switchActive`）（`M = action` 的主动更改不用前端记录）

换句话说除了 `M = action`、`M = initialize` 外的主动响应都需要自行同步更新 `state`。

`M = initialize` 的服务端请求会提供一个平凡的初始 `state`。

## 暂时目录

- [状态自动机](./state.md) 全局状态的组织
- [角色](./character.md)
- [手牌](./card.md)
- [状态与出战状态](./status.md)
- [通用数据描述](./data_desc.md) 数据描述的通用部分
