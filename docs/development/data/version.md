# 游戏版本管理

为了应用户需求，我添加了对不同版本游戏卡牌的描述。

## 卡牌描述

通常来说，行动牌和角色牌会生成带 `.since(VERSION)` 的链方法，如：

```ts
export const Kirara = character(1707)
  .since("v4.5.0")
  // [...]
```

这表明此牌仅在 4.5 版本后可用。当试图使用更早版本开始游戏时，会报“找不到此游戏版本的卡牌”错误。

平衡性调整则在 `src/old_versions` 中列出平衡性调整**之前**的版本。如 `src/old_versions/4.6.1.ts` 列出了 4.7 版本平衡性调整之前的卡牌代码。其中的所有实体都带有 `.until(VERSION)` 方法，如：

```ts
const InEveryHouseAStove = card(330005)
  .until("v4.6.1")
  .legend()
  // [...]
```

当游戏对局使用 4.6.1 或更早的版本时，将选取平衡性调整之前的版本运行，而非最新版本。

## 指定游戏版本

`@gi-tcg/data` 的默认导出返回一个函数 `(version?) => GameData`。若不指定 `version`，则启动最新版本的对局：

```ts
import getData from "@gi-tcg/data";

const state = Game.createInitialState({
  data: getData(),
  // [...]
});
```

显式传入参数来指定早期版本：

```ts
import getData from "@gi-tcg/data";

const state = Game.createInitialState({
  data: getData("v3.3.0"),
  // [...]
});
```
