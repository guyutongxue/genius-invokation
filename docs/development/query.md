# 实体查询语法

实体查询语法用以查询一个对局状态场上的实体。你可以通过 `game.query` 以此语法查询实体来调试。该语法被设计为和英语自然语言类似，并倾向于要求松散。

实体查询需要给定一个[对局状态](./state.md)，以及一个“当前阵营” `0` 或 `1`；查询结果即为查询到的实体状态的数组。“当前阵营”是用于指定查询语法中的 `my` 或 `opp` 的含义；比如“当前阵营”是 0 号玩家的时候，`my characters` 返回的是 0 号玩家的全部未倒下角色。

## 核心语法

```
[my | opp | all] <characters | summons | equipments | statuses | combat statuses | supports> [with-spec]
```

查询我方、对方或全部阵营的角色、召唤物、装备、角色状态、出战状态或支援牌。

如果不指定前面的阵营部分，则默认查询我方场上实体（不推荐依赖于默认行为，意图不明确）。

- 指定了 `my` 或者 `opp` 的同时可同时指定 `all`，后者无效果；如 `all my characters` 等价于 `my characters` 等价于 `characters`。
- 所有的 `s` `es` 后缀是可省略的。
- 也可以使用 `any` 指定所有实体（这通常和稍后的联合查询同时使用）。如 `all any` 用于查询场上的所有实体。
- 当指定 `characters` 时，默认**不包含倒下角色**。如果想要包含倒下角色，则使用 `characters include defeated`。如果仅查询倒下角色，则使用 `defeated characters`（如提瓦特煎蛋的目标为 `my defeated characters`）。
- 角色查询可使用以下位置说明符；当指定位置说明符时，`character` 关键字可省略：
  - `active` 出战角色
  - `standby` 后台角色
  - `next` 下一个（后台）角色
  - `prev` 上一个（后台）角色

## with-说明符

`with-spec` 是 with-说明符，用来限定实体的常量、变量、定义 id、实体 id 以及定义标签等。其语法包括：

```sh
with <var> = <expr>           # 限定变量
with <var> <op> <expr>        # 限定变量，但是使用比较运算符
with id = <expr>              # 限定实体 id
with definition id = <expr>   # 限定定义 id
with tags (<tag>, ...)        # 限定定义标签
not with ...                  # 反向查询
```

例如：
```sh
characters with health < 6    # 查询生命值小于 6 的角色
status with definition id 106 # 冻结状态（冻结的定义 id 是 106）
characters include defeated with tags (pyro) # 查询我方火系角色
```

- 等于运算符是 `=` 而非 `==`。`id = xxx` 可以视作变量限定的特例，但是 `id` 不允许用其它比较运算（也没有意义）。
- `tags` 要求该实体带有**全部的**标签。如果需要查询“其中一个”，请使用联合查询。
- `not with` 是在之前的查询限定范围内，删去所有满足 `with` 条件的意思。因此 `not with tags` 结果可能有包含其中一个标签的实体，因为该语句的原本含义为“不是‘同时带所有这些标签’的实体”。
- 一个特殊的标签查询具有语法 `<qual> tag of (<query>)`；其中 `qual` 为 `weapon` `element` 或 `nation`。其查询限定 `<query>` 返回的实体（必须是单个角色）中的武器、元素或国籍标签。比如 `my characters with element tag of (my active)` 返回我方角色中，与出战角色同一元素属性的角色。
- 使用 `(definition)` 语法来限定查询中的标识符指代定义中的常量而非变量。比如 `health` 指代角色状态的 `health` 即生命值，而 `health (definition)` 指代角色定义中的 `health`，即初始状态值。（在这种语境下，使用 `maxHealth` 是更合适的；当不存在变量名为 `health` 的变量时会选择定义中的 `maxHealth` 常量。）
- 如果变量名和关键字冲突，使用字符串字面量语法括起，如 `"health"`。

## 关系查询

有两种关系查询运算符 `has` 和 `at`。`<a> has <b>` 查询带有满足 `<b>` 的状态、装备的角色，`<a> at <b>` 查询附着于角色身上的装备或状态。

```sh
# 我方带有饱腹（定义 id 303300）状态的角色
characters has status with definition id 303300
# 敌方角色上的坍毁（特瓦林，定义 id 125021）状态
opp status with definition id 125021 at opp characters
```

关系查询的优先级小于阵营说明符，因此正如第二个例子所展示，如果需要限定阵营则需要同时指明（尽管这是不必要的，是我应该改一下）。

## 联合查询

`not` 用于取反，只查询不满足后续条件的实体。建议加个括号保证清晰的语义。

```sh
# 所有不包含饱腹状态的角色
not (characters has all status with definition id 303300)
```

`and` 联合查询用于限定同时满足两个查询条件的实体。

```sh
# 所有我方不包含饱腹状态的角色
my characters and all not (characters has all status with definition id 303300)
```

`or` 联合查询用于限定满足两个查询条件之一的实体，不常用。

## 子句

`order by` 子句用来限定查询返回结果的顺序。角色默认的排序顺序为结算顺序；否则按照子句指定的表达式结果**升序**排列。

```sh
# 我方角色，按照受伤程度由多至少排序
my characters order by health - maxHealth
```

`limit` 子句用来限定查询返回的角色个数。

```sh
# 我方首个充能未满的角色
my characters with energy != maxEnergy limit 1
```
