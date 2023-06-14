
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1404,
  health: 10,
  energy: 2,
  tags: ["electro", "pole", "sumeru"],
})
class Cyno {
  
  @Normal
  @Electro(1)
  @Void(2)
  invokerSSpear(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Electro(3)
  secretRiteChasmicSoulfarer(c: Context) {
    // 造成3点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>。
  }
  
  @Burst
  @Electro(4)
  @Energy(2)
  sacredRiteWolfSSwiftness(c: Context) {
    // 造成4点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，\n<color=#FFFFFFFF>启途誓使</color>的[凭依]级数+2。
  }
  
  // @Passive
  // lawfulEnforcer(c: Context) {
  //   // 【被动】战斗开始时，初始附属<color=#FFFFFFFF>启途誓使</color>。
  // }
}

register(Cyno);
