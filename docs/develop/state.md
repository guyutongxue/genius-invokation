# 游戏状态数据

为了合理进行骰子预运算、卡牌可用性预运算、状态预览等功能，游戏的所有数据被存放在一个 `GameState` **不可变**结构内。任何情况下，不能对 `GameState` 的任何内部结构做修改。

若要修改数据，则应当对 `GameState` 做重新赋值。类 `Store` 管理 `GameState` 的赋值操作。

`Store` 使用 `immer` 库进行不可变状态管理。其成员方法 `_produce` 接受改动草稿，并应用到内部状态字段 `_state` 上。

`Store` 提供两个方面的接口：
1. `state` 只读的数据访问接口；
2. `mutator` 数据修改器。

> 虽然 `_produce` 仍然是 TypeScript 公开方法，但应当仅在 `mutator` 中修改数据。`mutator` 内部应用 `Store.prototype._produce`。

`Store` 提供 `clone` 与 `apply` 方法以实现状态的克隆和应用，用于进行各种预运算。

## 数据修改器

`mutator` 本身提供一些方法，如造成伤害、治疗、引发事件等。其内部还有两成员 `players[*]`，提供玩家的操作，如掷骰、增加阵营实体等。

### IO

对于主体 `Store` 的 `mutator`，它会和前端进行 IO 操作；对于克隆出来的 `Store`，其试图进行 IO 操作会引发 `IONotAvailableError`。
