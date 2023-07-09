# `typings` - 前后端通信类型定义与校验

## 综述

前后端共设计三条通信信道：
- `notification`：单工，由服务器主动发起通信，客户端不回复；用于通知玩家状态更新。
- `rpc`：半双工，由服务器主动发起通信；用于请求玩家行动并获得行动信息。
- `user`：半双工，由客户端主动发起通信；用于放弃对局、预览伤害等特殊情形。

## `notification` 信道

通知格式包括 `state` 参数和 `event` 参数。`state` 包含当前游戏的所有可见信息，`event` 指示该时间点正在触发的事件。
- `event.type` 通常设置为 `stateUpdated`。如果该状态更新是相比上一状态有伤害/治疗，则设置 `damages` 字段。
- `event.type` 还包括如下类型：
  - `newGamePhase` 新的阶段/回合/行动轮；
  - `gameEnd` 游戏结束；
  - `playCard` 双方玩家打出手牌；
  - `useSkill` 双方玩家使用技能；
  - `switchActive` 双方玩家切换角色；
  - `declareEnd` 双方玩家宣告结束；
  - `oppChangeHands` 对方的手牌发生变动；（我方手牌变动直接使用 `stateUpdated`）
  - `oppChoosingActive` 对方正在强制切人中；

