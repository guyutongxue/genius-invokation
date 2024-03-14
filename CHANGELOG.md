# 更新日志

**仅记录破坏性改动。**

## 0.3.0

- `DamageType` 增加了 `DamageType.Revive`，复苏时的治疗改用此类型指代
  - 此类治疗不触发“角色受到治疗后”的效果
- `CharacterState.damageLog` 的类型修改为 `readonly (DamageInfo | HealInfo)[]`
  - `DamageInfo.type` 现不包含 `DamageType.Heal` 和 `DamageType.Revive`

## 0.2.0

- `GameOption` 增加了更多 `readonly` 修饰。
- `initHands` 阶段在切换手牌前增加了一个暂停点。

## 0.1.?

- `GameOption` 增加了一系列 `readonly` 修饰。
