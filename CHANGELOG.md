# 更新日志

**仅记录破坏性改动。**

## 0.5.0

- 暂时移除了 `pushDamageLog` 类型的 mutation

## 0.4.0

- 修改了 `IteratorState` 的结构（不再依赖于 `@stdlib/minstd*`）

## 0.3.0

- `DamageType` 增加了 `DamageType.Revive`，复苏时的治疗改用此类型指代
- `CharacterState.damageLog` 的类型修改为 `readonly (DamageInfo | HealInfo)[]`
  - `DamageInfo.type` 现不包含 `DamageType.Heal` 和 `DamageType.Revive`

## 0.2.0

- `GameOption` 增加了更多 `readonly` 修饰。
- `initHands` 阶段在切换手牌前增加了一个暂停点。

## 0.1.?

- `GameOption` 增加了一系列 `readonly` 修饰。
