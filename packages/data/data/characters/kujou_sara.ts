
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1406,
  health: 10,
  energy: 2,
  tags: ["electro", "bow", "inazuma"],
})
class KujouSara {
  
  @Normal
  @Electro(1)
  @Void(2)
  tenguBowmanship(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Electro(3)
  tenguStormcall(c: Context) {
    // 造成1点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，召唤<color=#FFFFFFFF>天狗咒雷·伏</color>。
  }
  
  @Burst
  @Electro(4)
  @Energy(2)
  subjugationKoukouSendou(c: Context) {
    // 造成1点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，召唤<color=#FFFFFFFF>天狗咒雷·雷砾</color>。
  }
}

register(KujouSara);
