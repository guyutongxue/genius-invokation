
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1504,
  health: 10,
  energy: 2,
  tags: ["anemo", "pole", "liyue"],
})
class Xiao {
  
  @Normal
  @Anemo(1)
  @Void(2)
  whirlwindThrust(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Anemo(3)
  lemniscaticWindCycling(c: Context) {
    // 造成3点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>。
  }
  
  @Burst
  @Anemo(3)
  @Energy(2)
  baneOfAllEvil(c: Context) {
    // 造成4点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>，本角色附属<color=#FFFFFFFF>夜叉傩面</color>。
  }
}

register(Xiao);
