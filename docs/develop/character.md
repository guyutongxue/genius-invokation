# 角色

## 数据描述方法

`data` 包提供尽可能简单的角色描述方法（项目目标）。

```ts
import { /* ... */ } from "@jenshin-tcg";

@Characer({
  objectId: /* ID */,
  health: /* 生命值上限 */,
  energy: /* 能量条上限 */,
  tags: [/* 角色标签，用于导出组队限制等 */]
})
class Venti {
  // 使用装饰器+类方法描述角色技能
  @Normal   // 技能类别
  @Anemo(1) // 消耗骰子
  @Void(2)
  divineMarksmanship(c: Context) {
    // [...]
  }
  
  @Skill
  @Anemo(3)
  skywardSonnet(c: Context) {
    // [...]
  }
  
  @Burst
  @Anemo(3)
  @Energy(2)
  windSGrandOde(c: Context) {
    // [...]
  }

  // 被动技能（TODO）
  @Passive
  kamisatoArtSenho: {
    onSwitchActive(c: Context) {
      // [...]
    }
  }
}

register(Venti);
```

技能描述里的 `Context` 实际为 `SkillDescriptionContext`，提供了比通用语境更多的方法。
