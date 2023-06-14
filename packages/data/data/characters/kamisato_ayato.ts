
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1206,
  health: 10,
  energy: 3,
  tags: ["hydro", "sword", "inazuma"],
})
class KamisatoAyato {
  
  @Normal
  @Hydro(1)
  @Void(2)
  kamisatoArtMarobashi(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Hydro(3)
  kamisatoArtKyouka(c: Context) {
    // 造成2点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，本角色附属<color=#FFFFFFFF>泷廻鉴花</color>。
  }
  
  @Burst
  @Hydro(3)
  @Energy(3)
  kamisatoArtSuiyuu(c: Context) {
    // 造成3点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，召唤<color=#FFFFFFFF>清净之园囿</color>。
  }
}

register(KamisatoAyato);
