
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2301,
  health: 10,
  energy: 2,
  tags: ["pyro", "fatui"],
})
class FatuiPyroAgent {
  
  @Normal
  @Pyro(1)
  @Void(2)
  thrust(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Pyro(3)
  prowl(c: Context) {
    // 造成1点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>，本角色附属<color=#FFFFFFFF>潜行</color>。
  }
  
  @Burst
  @Pyro(3)
  @Energy(2)
  bladeAblaze(c: Context) {
    // 造成5点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>。
  }
  
  // @Passive
  // stealthMaster(c: Context) {
  //   // 【被动】战斗开始时，初始附属<color=#FFFFFFFF>潜行</color>。
  // }
}

register(FatuiPyroAgent);
