
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1405,
  health: 10,
  energy: 3,
  tags: ["electro", "claymore", "liyue"],
})
class Beidou {
  
  @Normal
  @Electro(1)
  @Void(2)
  oceanborne(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Electro(3)
  tidecaller(c: Context) {
    // 本角色附属<color=#FFFFFFFF>捉浪·涛拥之守</color>并<color=#FFFFFFFF>准备技能</color>：<color=#FFFFFFFF>踏潮</color>。
  }
  
  @Burst
  @Electro(4)
  @Energy(3)
  stormbreaker(c: Context) {
    // 造成3点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，生成<color=#FFFFFFFF>雷兽之盾</color>。
  }
  
  @Skill
  
  wavestrider(c: Context) {
    // （需准备1个行动轮）\n造成2点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>。
  }
}

register(Beidou);
