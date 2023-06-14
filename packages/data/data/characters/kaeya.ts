
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1103,
  health: 10,
  energy: 2,
  tags: ["cryo", "sword", "mondstadt"],
})
class Kaeya {
  
  @Normal
  @Cryo(1)
  @Void(2)
  ceremonialBladework(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Cryo(3)
  frostgnaw(c: Context) {
    // 造成3点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>。
  }
  
  @Burst
  @Cryo(4)
  @Energy(2)
  glacialWaltz(c: Context) {
    // 造成1点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，生成<color=#FFFFFFFF>寒冰之棱</color>。
  }
}

register(Kaeya);
