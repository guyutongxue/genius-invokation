
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1502,
  health: 10,
  energy: 3,
  tags: ["anemo", "sword", "mondstadt"],
})
class Jean {
  
  @Normal
  @Anemo(1)
  @Void(2)
  favoniusBladework(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Anemo(3)
  galeBlade(c: Context) {
    // 造成3点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>，使对方强制切换到下一个角色。
  }
  
  @Burst
  @Anemo(4)
  @Energy(3)
  dandelionBreeze(c: Context) {
    // 治疗所有我方角色2点，召唤<color=#FFFFFFFF>蒲公英领域</color>。
  }
}

register(Jean);
