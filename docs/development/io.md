# 玩家 IO

IO 格式定义于包 `@gi-tcg/typings`。

## `rpc` 请求玩家行动

由四种请求玩家行动的情形：

### `rerollDice` 请求重投骰子

- **请求格式**： 无；玩家先前收到的牌局状态中的骰子列表即是可以重投的骰子。
- **响应格式**： `{ rerollIndexes: number[] }` 指示需要重投的骰子下标。

### `switchHands` 请求选择任意张手牌切换

- **请求格式**：无；玩家先前收到的牌局状态中的手牌列表即是可以切换的手牌。
- **响应格式**：`{ removedHands: number[] }` 需要移出手牌的卡牌 id。

应响应卡牌 id 而非卡牌定义 id。

### `chooseActive` 请求选择出战角色

- **请求格式**：`{ candidates: number[] }` 可供选择的出战角色 id 列表。
- **响应格式**：`{ active: number }` 确定选择的出战角色 id。

请求和响应都是角色实体 id 而非定义 id。

### `action` 请求玩家行动

#### 请求格式

```ts
// candidates 字段提供所有可选的行动列表
export interface ActionRequest {
  candidates: Action[];
}
// 共有五种行动
type Action = SwitchActiveAction | PlayCardAction | UseSkillAction | ElementalTuningAction | DeclareEndAction;


// 切换出战角色行动
interface SwitchActiveAction {
  type: "switchActive";
  active: number;                // 出战角色 id
  cost: DiceType[];              // 所需消耗的骰子，下同
}
// 打出手牌行动
interface PlayCardAction {
  type: "playCard";
  card: number;                  // 卡牌 id
  cost: DiceType[];
  targets: number[];             // 该卡牌的作用目标实体 id
  preview?: StateData;           // 可提供效果预览
}
// 使用角色技能行动
interface UseSkillAction {
  type: "useSkill";
  skill: number;                 // 技能 id
  cost: DiceType[];
  preview?: StateData;           // 可提供效果预览
}
// 元素调和行动
interface ElementalTuningAction {
  type: "elementalTuning";
  discardedCard: number;         // 用来调和的手牌卡牌 id
  target: DiceType;              // 目标骰子类型（出战角色元素）
}
// 宣布结束行动
interface DeclareEndAction {
  type: "declareEnd";
}
```

其中，`PlayCardAction` 的 `targets` 指这个打出手牌行动使用的目标。如果一张卡牌的打出有多种可能的目标，则请求中会生成三份 `Action` 分别指代它们。

#### 响应格式

```ts
export interface ActionResponse {
  chosenIndex: number;  // 选中的 Action 在请求负载中的下标
  cost: DiceType[];     // 选中的要使用的骰子（如果不使用骰子，填入 []）
}
```

## `notification` 通知玩家有牌局变化

包括如下三个字段：

### `newState`

当前的对局状态。和 [`GameState`](./state.md) 类似但是不同：
- 隐藏了对手的手牌和骰子情况（只提供数量，内容全部为 0）；
- 隐藏双方的牌堆情况；
- 不提供不必要的常量、变量、定义；

具体字段参考 [源码](/packages/typings/src/api/notification.ts)。

### `mutations`

自上次 `notification` 起的详细 mutations 情况，但隐藏了不应向玩家暴露的细节。此外，还提供如伤害、元素反应等信息。

具体字段参考 [源码](/packages/typings/src/api/mutation.ts)。
