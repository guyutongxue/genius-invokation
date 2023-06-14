
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2101,
  health: 10,
  energy: 3,
  tags: ["cryo", "fatui"],
})
class FatuiCryoCicinMage {
  
  @Normal
  @Cryo(1)
  @Void(2)
  cicinIcicle(c: Context) {
    // 造成1点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>。
  }
  
  @Skill
  @Cryo(3)
  mistySummons(c: Context) {
    // 造成1点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，召唤<color=#FFFFFFFF>冰萤</color>。
  }
  
  @Burst
  @Cryo(3)
  @Energy(3)
  blizzardBranchBlossom(c: Context) {
    // 造成5点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，本角色<color=#99FFFFFF>附着{SPRITE_PRESET#2101}冰元素</color>，生成<color=#FFFFFFFF>流萤护罩</color>。
  }
}

register(FatuiCryoCicinMage);
