
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1205,
  health: 10,
  energy: 2,
  tags: ["hydro", "catalyst", "inazuma"],
})
class SangonomiyaKokomi {
  
  @Normal
  @Hydro(1)
  @Void(2)
  theShapeOfWater(c: Context) {
    // 造成1点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>。
  }
  
  @Skill
  @Hydro(3)
  kurageSOath(c: Context) {
    // 本角色<color=#80C0FFFF>附着{SPRITE_PRESET#2102}水元素</color>，召唤<color=#FFFFFFFF>化海月</color>。
  }
  
  @Burst
  @Hydro(3)
  @Energy(2)
  nereidSAscension(c: Context) {
    // 造成2点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，治疗所有我方角色1点，本角色附属<color=#FFFFFFFF>仪来羽衣</color>。
  }
}

register(SangonomiyaKokomi);
