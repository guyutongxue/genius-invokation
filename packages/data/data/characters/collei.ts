
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1701,
  health: 10,
  energy: 2,
  tags: ["dendro", "bow", "sumeru"],
})
class Collei {
  
  @Normal
  @Dendro(1)
  @Void(2)
  supplicantSBowmanship(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Dendro(3)
  floralBrush(c: Context) {
    // 造成3点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>。
  }
  
  @Burst
  @Dendro(3)
  @Energy(2)
  trumpCardKitty(c: Context) {
    // 造成2点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>，召唤<color=#FFFFFFFF>柯里安巴</color>。
  }
}

register(Collei);
