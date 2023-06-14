
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1305,
  health: 10,
  energy: 3,
  tags: ["pyro", "bow", "inazuma"],
})
class Yoimiya {
  
  @Normal
  @Pyro(1)
  @Void(2)
  fireworkFlareUp(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Pyro(1)
  niwabiFireDance(c: Context) {
    // 本角色附属<color=#FFFFFFFF>庭火焰硝</color>。（此技能不产生{SPRITE_PRESET#1110}充能）
  }
  
  @Burst
  @Pyro(4)
  @Energy(3)
  ryuukinSaxifrage(c: Context) {
    // 造成4点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>，生成<color=#FFFFFFFF>琉金火光</color>。
  }
}

register(Yoimiya);
