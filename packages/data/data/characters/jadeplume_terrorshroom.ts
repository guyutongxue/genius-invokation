
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2701,
  health: 10,
  energy: 2,
  tags: ["dendro", "monster"],
})
class JadeplumeTerrorshroom {
  
  @Normal
  @Dendro(1)
  @Void(2)
  majesticDance(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Dendro(3)
  volatileSporeCloud(c: Context) {
    // 造成3点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>。
  }
  
  @Burst
  @Dendro(3)
  @Energy(2)
  featherSpreading(c: Context) {
    // 造成4点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>，消耗所有<color=#FFFFFFFF>活化激能</color>层数，每层使此伤害+1。
  }
  
  // @Passive
  // radicalVitality(c: Context) {
  //   // 【被动】战斗开始时，初始附属<color=#FFFFFFFF>活化激能</color>。
  // }
}

register(JadeplumeTerrorshroom);
