
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1601,
  health: 10,
  energy: 3,
  tags: ["geo", "catalyst", "liyue"],
})
class Ningguang {
  
  @Normal
  @Geo(1)
  @Void(2)
  sparklingScatter(c: Context) {
    // 造成1点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>。
  }
  
  @Skill
  @Geo(3)
  jadeScreen(c: Context) {
    // 造成2点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>，生成<color=#FFFFFFFF>璇玑屏</color>。
  }
  
  @Burst
  @Geo(3)
  @Energy(3)
  starshatter(c: Context) {
    // 造成6点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>；如果<color=#FFFFFFFF>璇玑屏</color>在场，就使此伤害+2。
  }
}

register(Ningguang);
