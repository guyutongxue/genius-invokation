# 玩家 IO

IO 格式定义于包 `@gi-tcg/typings`。所有的 IO 均为 Protocol Buffer 导出的 JS 类型，详细格式参见 [`.proto` 源码](/packages/typings/src/proto/)。

## `rpc` 请求玩家行动

由五种请求玩家行动的情形。本项目的 JS 请求数据格式 `RpcRequest` 具有形式：
```js
{
  [method]: request
}
```
如

```js
{
  switchActive: {
    candidateIds: [...]
  }
}
```

则 `rpc` 处理函数需要返回相应的响应格式 `RpcResponse`：

```js
{
  switchActive: {
    activeCharacterId: ...
  }
}
```

以下是五种请求的方法名和格式简介；具体请参考 protobuf 消息定义或生成的 TS 源码。

### `rerollDice` 请求重投骰子

- **请求格式**： 无；玩家先前收到的牌局状态中的骰子列表即是可以重投的骰子。
- **响应格式**： 指示需要重投的骰子。

### `switchHands` 请求选择任意张手牌切换

- **请求格式**：无；玩家先前收到的牌局状态中的手牌列表即是可以切换的手牌。
- **响应格式**：需要移出手牌的卡牌 id。

应响应卡牌 id 而非卡牌定义 id。

### `selectCard` 挑选

- **请求格式**：可供挑选的卡牌定义 id。
- **响应格式**：用户确定选择的卡牌定义 id。

### `chooseActive` 请求选择出战角色

- **请求格式**：可供选择的出战角色 id 列表。
- **响应格式**：确定选择的出战角色 id。

请求和响应都是角色实体 id 而非定义 id。

### `action` 请求玩家行动

- **请求格式**：由五种可能得行动构成的行动列表。
- **相应格式**：请求列表中玩家选中的行动的下标，以及指定使用的骰子。

## `notification` 通知玩家有牌局变化

包括如下三个字段：

### `state`

当前的对局状态。和 [`GameState`](./state.md) 类似但是不同：
- 隐藏了对手的手牌和骰子情况（只提供数量，内容全部为 0）；
- 隐藏双方的牌堆情况；
- 不提供不必要的常量、变量、定义；

### `mutation`

自上次 `notification` 起的详细 mutations 情况，但隐藏了不应向玩家暴露的细节。此外，还提供如伤害、元素反应等信息。

