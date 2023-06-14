
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1104,
  health: 10,
  energy: 3,
  tags: ["cryo", "claymore", "liyue"],
})
class Chongyun {
  
  @Normal
  @Cryo(1)
  @Void(2)
  demonbane(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Cryo(3)
  chonghuaSLayeredFrost(c: Context) {
    // 造成3点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，生成<color=#FFFFFFFF>重华叠霜领域</color>。
  }
  
  @Burst
  @Cryo(3)
  @Energy(3)
  cloudPartingStar(c: Context) {
    // 造成7点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>。
  }
}

register(Chongyun);
