
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1102,
  health: 10,
  energy: 3,
  tags: ["cryo", "bow", "mondstadt"],
})
class Diona {
  
  @Normal
  @Cryo(1)
  @Void(2)
  kTzleinStyle(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Cryo(3)
  icyPaws(c: Context) {
    // 造成2点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，生成<color=#FFFFFFFF>猫爪护盾</color>。
  }
  
  @Burst
  @Cryo(3)
  @Energy(3)
  signatureMix(c: Context) {
    // 造成1点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，治疗此角色2点，召唤<color=#FFFFFFFF>酒雾领域</color>。
  }
}

register(Diona);
