
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1702,
  health: 10,
  energy: 2,
  tags: ["dendro", "bow", "sumeru"],
})
class Tighnari {
  
  @Normal
  @Dendro(1)
  @Void(2)
  khandaBarrierBuster(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Dendro(3)
  vijnanaPhalaMine(c: Context) {
    // 造成2点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>，本角色附属<color=#FFFFFFFF>通塞识</color>。
  }
  
  @Burst
  @Dendro(3)
  @Energy(2)
  fashionerSTanglevineShaft(c: Context) {
    // 造成4点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>，对所有敌方后台角色造成1点<color=#FFFFFFFF><color=#FFFFFFFF>穿透伤害</color></color>。
  }
}

register(Tighnari);
