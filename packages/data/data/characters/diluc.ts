
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1301,
  health: 10,
  energy: 3,
  tags: ["pyro", "claymore", "mondstadt"],
})
class Diluc {
  
  @Normal
  @Pyro(1)
  @Void(2)
  temperedSword(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Pyro(3)
  searingOnslaught(c: Context) {
    // 造成3点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>。每回合第三次使用本技能时，伤害+2。
  }
  
  @Burst
  @Pyro(4)
  @Energy(3)
  dawn(c: Context) {
    // 造成8点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>，本角色附属<color=#FFFFFFFF>火元素附魔</color>。
  }
}

register(Diluc);
