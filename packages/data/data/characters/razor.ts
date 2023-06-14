
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1402,
  health: 10,
  energy: 3,
  tags: ["electro", "claymore", "mondstadt"],
})
class Razor {
  
  @Normal
  @Electro(1)
  @Void(2)
  steelFang(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Electro(3)
  clawAndThunder(c: Context) {
    // 造成3点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>。
  }
  
  @Burst
  @Electro(3)
  @Energy(3)
  lightningFang(c: Context) {
    // 造成5点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，本角色附属<color=#FFFFFFFF>雷狼</color>。
  }
}

register(Razor);
