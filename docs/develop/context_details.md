# 子操作语境

## 角色操作语境

### 该语境出现场合

- `queryCharacter`、`queryCharacterAll` 的返回结果；
- 技能描述语境的 `character`；
- 卡牌描述语境的 `target`；
- 伤害描述语境的 `target`；
- 切换出战角色语境的 `from` 和 `to`。

### 只读方法

- `entityId` 实体 ID，用来判别两个角色是否为同一角色
- `info` 角色信息
- `health` 角色生命值
- `energy` 角色充能值
- `aura` 角色元素附着状态
- `isAlive()` 角色是否未击倒
- `isMine()` 是否为我方角色
- `skillDisabled()` 技能是否被禁用（冻结、石化）
- `findEquipment(equipmentHandle)` 查找装备牌
- `findStatus(statusHandle)` 查找角色状态
- `findShield()` 查找带有护盾的角色状态
- `isActive()` 是否为出战角色
- `asTarget()` 转换到选择器语法
- `elementType()` 该角色元素类型

### 修改方法

- `equip` 装备装备牌
- `removeEquipment` 移除装备牌（藏锋何处、诸武精通）
- `heal` 治疗该角色
- `gainEnergy` 获得能量
- `loseEnergy` 失去能量
- `createStatus` 附属角色状态
- `removeStatus` 移除角色状态

## 实体操作语境

### 该语境出现场合

- `findCombatStatus` `findSummon` `findEquipment` `findStatus` 等查找实体的方法。

### 只读方法

- `entityId` 实体 ID
- `id` 类型 ID，等价于 `info.id` but better typing
- `info` 实体信息
- `type` 指明该实体是装备/状态/召唤物/...
- `master` 若该实体附着于/装备于/附属于某角色，返回该角色的操作语境
- `isMine()` 是否为我方场上实体
- `usage` 可用次数（不限为 `Infinity`）
- `value` 可见数值（见下文）

### 修改方法

- `setUsage` 设置可用次数
- `setValue` 设置可见数值
- `dispose` 弃置此牌

### 实体可见数值

= 若实体指定了可用次数、每回合可用次数、持续回合数等，则该数值即为实体 *可见数值*。
- 若该实体提供护盾，则可见数值为剩余“盾量”。
- 否则，为自定义属性中的某个不以 `_` 开头的，数值类型的属性值。
