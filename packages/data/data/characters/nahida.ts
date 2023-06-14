
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1703,
  health: 10,
  energy: 2,
  tags: ["dendro", "catalyst", "sumeru"],
})
class Nahida {
  
  @Normal
  @Dendro(1)
  @Void(2)
  akara(c: Context) {
    // 造成1点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>。
  }
  
  @Skill
  @Dendro(3)
  allSchemesToKnow(c: Context) {
    // 造成2点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>，目标角色附属<color=#FFFFFFFF>蕴种印</color>；如果在附属前目标角色已附属有<color=#FFFFFFFF>蕴种印</color>，就改为对所有敌方角色附属<color=#FFFFFFFF>蕴种印</color>。
  }
  
  @Skill
  @Dendro(5)
  allSchemesToKnowTathata(c: Context) {
    // 造成3点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>，所有敌方角色附属<color=#FFFFFFFF>蕴种印</color>。
  }
  
  @Burst
  @Dendro(3)
  @Energy(2)
  illusoryHeart(c: Context) {
    // 造成4点{SPRITE_PRESET#2107}<color=#7EC236FF>草元素伤害</color>，生成<color=#FFFFFFFF>摩耶之殿</color>。
  }
}

register(Nahida);
