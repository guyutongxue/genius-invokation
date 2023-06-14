
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1307,
  health: 10,
  energy: 3,
  tags: ["pyro", "pole", "liyue"],
})
class HuTao {
  
  @Normal
  @Pyro(1)
  @Void(2)
  secretSpearOfWangsheng(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Pyro(2)
  guideToAfterlife(c: Context) {
    // 本角色附属<color=#FFFFFFFF>彼岸蝶舞</color>。
  }
  
  @Burst
  @Pyro(3)
  @Energy(3)
  spiritSoother(c: Context) {
    // 造成4点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>，治疗自身2点。如果本角色生命值不多于6，则造成的伤害和治疗各+1。
  }
}

register(HuTao);
