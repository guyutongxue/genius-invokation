
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1202,
  health: 10,
  energy: 2,
  tags: ["hydro", "sword", "liyue"],
})
class Xingqiu {
  
  @Normal
  @Hydro(1)
  @Void(2)
  guhuaStyle(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Hydro(3)
  fatalRainscreen(c: Context) {
    // 造成2点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，本角色<color=#80C0FFFF>附着{SPRITE_PRESET#2102}水元素</color>，生成<color=#FFFFFFFF>雨帘剑</color>。
  }
  
  @Burst
  @Hydro(3)
  @Energy(2)
  raincutter(c: Context) {
    // 造成1点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，本角色<color=#80C0FFFF>附着{SPRITE_PRESET#2102}水元素</color>，生成<color=#FFFFFFFF>虹剑势</color>。
  }
}

register(Xingqiu);
