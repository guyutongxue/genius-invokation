
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2601,
  health: 8,
  energy: 2,
  tags: ["geo", "monster", "hilichurl"],
})
class StonehideLawachurl {
  
  @Normal
  @Geo(1)
  @Void(2)
  plamaLawa(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Geo(3)
  movoLawa(c: Context) {
    // 造成3点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Burst
  @Geo(3)
  @Energy(2)
  upaShato(c: Context) {
    // 造成5点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  // @Passive
  // infusedStonehide(c: Context) {
  //   // 【被动】战斗开始时，初始附属<color=#FFFFFFFF>岩盔</color>和<color=#FFFFFFFF>坚岩之力</color>。
  // }
}

register(StonehideLawachurl);
