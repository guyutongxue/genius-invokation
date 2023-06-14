
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1107,
  health: 10,
  energy: 2,
  tags: ["cryo", "pole", "liyue"],
})
class Shenhe {
  
  @Normal
  @Cryo(1)
  @Void(2)
  dawnstarPiercer(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Cryo(3)
  springSpiritSummoning(c: Context) {
    // 造成2点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，生成<color=#FFFFFFFF>冰翎</color>。
  }
  
  @Burst
  @Cryo(3)
  @Energy(2)
  divineMaidenSDeliverance(c: Context) {
    // 造成1点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，召唤<color=#FFFFFFFF>箓灵</color>。
  }
}

register(Shenhe);
