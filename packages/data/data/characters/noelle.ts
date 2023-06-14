
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1602,
  health: 10,
  energy: 2,
  tags: ["geo", "claymore", "mondstadt"],
})
class Noelle {
  
  @Normal
  @Geo(1)
  @Void(2)
  favoniusBladeworkMaid(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Geo(3)
  breastplate(c: Context) {
    // 造成1点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>，生成<color=#FFFFFFFF>护体岩铠</color>。
  }
  
  @Burst
  @Geo(4)
  @Energy(2)
  sweepingTime(c: Context) {
    // 造成4点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>，本角色附属<color=#FFFFFFFF>大扫除</color>。
  }
}

register(Noelle);
