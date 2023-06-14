
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2302,
  health: 6,
  energy: 2,
  tags: ["pyro", "monster"],
})
class AbyssLectorFathomlessFlames {
  
  @Normal
  @Pyro(1)
  @Void(2)
  flameOfSalvation(c: Context) {
    // 造成1点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>。
  }
  
  @Skill
  @Pyro(3)
  searingPrecept(c: Context) {
    // 造成3点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>。
  }
  
  @Burst
  @Pyro(4)
  @Energy(2)
  ominousStar(c: Context) {
    // 造成3点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>，召唤<color=#FFFFFFFF>黯火炉心</color>。
  }
  
  // @Passive
  // fieryRebirth(c: Context) {
  //   // 【被动】战斗开始时，初始附属<color=#FFFFFFFF>火之新生</color>。
  // }
}

register(AbyssLectorFathomlessFlames);
