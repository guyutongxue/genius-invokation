
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1501,
  health: 10,
  energy: 2,
  tags: ["anemo", "catalyst", "mondstadt"],
})
class Sucrose {
  
  @Normal
  @Anemo(1)
  @Void(2)
  windSpiritCreation(c: Context) {
    // 造成1点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>。
  }
  
  @Skill
  @Anemo(3)
  astableAnemohypostasisCreation(c: Context) {
    // 造成3点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>，使对方强制切换到前一个角色。
  }
  
  @Burst
  @Anemo(3)
  @Energy(2)
  forbiddenCreationIsomerTypeII(c: Context) {
    // 造成1点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>，召唤<color=#FFFFFFFF>大型风灵</color>。
  }
}

register(Sucrose);
