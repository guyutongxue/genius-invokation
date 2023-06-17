# 状态与出战状态

## 数据描述方法

出战状态是类似触发器的存在，即“当发生……时，做……”的行为。因此它的描述方法大约是这样的：

```ts
// 激化领域（雷+草）

@Status({
  objectId: 117, // ID
  usage: 2,      // 可用次数
})
export class InspirationField implements IStatus {
  // 当我方造成伤害前，进行额外的结算
  onBeforeDealDamage(c: DamageContext) {
    // 原描述：对出战角色造成雷元素或草元素伤害时
    if (
      c.target.isActive() &&
      (c.damageType === DamageType.ELECTRO || c.damageType == DamageType.DENDRO)
    ) {
      c.addDamage(2);   // 增加两点伤害值
      return true;      // 返回 true，代表扣除可用次数
    }
    /* return false; */ // 返回 false 或 undefined 代表不扣除可用次数
  }
}
```

这里的 `DamageContext` 除了全局语境外，还包含修改伤害的方法，提供加法、乘法和改类型（附魔）三种。

`IStatus` 可响应的事件除了全局事件外，还包含如下定义：

- `onBeforeUseSkill`：当所**附着的角色** <sup>*</sup> 使用技能前，进行额外结算；
- `onUseSkill`：当所**附着的角色**使用技能后；
- `onSwitchActiveFrom`：当所**附着的角色**被切走后；
- `onSwitchActive`：当切换到**附着的角色**后；
- `onBeforeDamaged`：当所**附着的角色**受到伤害前，进行额外结算；
- `onDamaged`：当所**附着的角色**受到伤害后；

<sup>*</sup> 对于出战状态，指出战角色，下同。

注意：这里 **覆盖** 了一些全局事件；对于其他实体，所有我方角色的相关事件都会触发行动是，但是对于状态与出战状态，只有所**附着的角色**上的事件才会触发。

> 状态与出战状态设计上应当不会对其他角色的事件进行响应，但愿米忽悠别再忽悠我。

