# 更新日志

**仅记录破坏性改动。**

## 0.9.0
- Mutation `replaceCharacterDefinition` 重命名为 `transformDefinition`
- 移除了 `GameLog` 相关接口；在 `pause` 中增加了 `canResume` 第三参数

## 0.8.0
- 重构：`GameState` 中部分全局状态值改为由数据提供的可自定义 `extensions`

## 0.7.0
- 恢复了 0.4.x 版本的暂停点密度（通知密度无变化）
- `pause` 现在返回自上次 `pause` 起的所有裸 `Mutation`s，不再包含 `ExposedMutation`s，
  - `pause` 自此无法获取伤害、元素反应等上层信息（请使用 `notify` 接口接取）
- 调整了 `Mutation`s 的部分结构

## 0.6.0

- 暂时移除了 `mutationLog` 字段
- 将 `NotificationMessage` 中的 `events` 改名为`mutations`
- 修改了包发布流程，类型信息可能有所变化

## 0.5.0

- 暂时移除了 `pushDamageLog` 类型的 mutation
- 重构了结算流程；在技能结算中可能引发更多的暂停点

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
