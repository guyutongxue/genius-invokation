
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1401,
  health: 10,
  energy: 3,
  tags: ["electro", "bow", "mondstadt"],
})
class Fischl {
  
  @Normal
  @Electro(1)
  @Void(2)
  boltsOfDownfall(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Electro(3)
  nightrider(c: Context) {
    // 造成1点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，召唤<color=#FFFFFFFF>奥兹</color>。
  }
  
  @Burst
  @Electro(3)
  @Energy(3)
  midnightPhantasmagoria(c: Context) {
    // 造成4点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，对所有敌方后台角色造成2点<color=#FFFFFFFF><color=#FFFFFFFF>穿透伤害</color></color>。
  }
}

register(Fischl);
