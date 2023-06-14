
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1407,
  health: 10,
  energy: 2,
  tags: ["electro", "pole", "inazuma"],
})
class RaidenShogun {
  
  @Normal
  @Electro(1)
  @Void(2)
  origin(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Electro(3)
  transcendenceBalefulOmen(c: Context) {
    // 召唤<color=#FFFFFFFF>雷罚恶曜之眼</color>。
  }
  
  @Burst
  @Electro(4)
  @Energy(2)
  secretArtMusouShinsetsu(c: Context) {
    // 造成3点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，其他我方角色获得2点<color=#FFFFFFFF>{SPRITE_PRESET#1110}充能</color>。
  }
  
  // @Passive
  // chakraDesiderata(c: Context) {
  //   // 【被动】战斗开始时，初始附属<color=#FFFFFFFF>诸愿百眼之轮</color>。
  // }
}

register(RaidenShogun);
