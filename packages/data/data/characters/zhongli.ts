
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1603,
  health: 10,
  energy: 3,
  tags: ["geo", "pole", "liyue"],
})
class Zhongli {
  
  @Normal
  @Geo(1)
  @Void(2)
  rainOfStone(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Geo(3)
  dominusLapidis(c: Context) {
    // 造成1点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>，召唤<color=#FFFFFFFF>岩脊</color>。
  }
  
  @Skill
  @Geo(5)
  dominusLapidisStrikingStone(c: Context) {
    // 造成3点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>，召唤<color=#FFFFFFFF>岩脊</color>，生成<color=#FFFFFFFF>玉璋护盾</color>。
  }
  
  @Burst
  @Geo(3)
  @Energy(3)
  planetBefall(c: Context) {
    // 造成4点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>，目标角色附属<color=#FFFFFFFF>石化</color>。
  }
}

register(Zhongli);
