
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1605,
  health: 10,
  energy: 3,
  tags: ["geo", "claymore", "inazuma"],
})
class AratakiItto {
  
  @Normal
  @Geo(1)
  @Void(2)
  fightClubLegend(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Geo(3)
  masatsuZetsugiAkaushiBurst(c: Context) {
    // 造成1点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>，召唤<color=#FFFFFFFF>阿丑</color>，本角色附属<color=#FFFFFFFF>乱神之怪力</color>。
  }
  
  @Burst
  @Geo(3)
  @Energy(3)
  royalDescentBeholdIttoTheEvil(c: Context) {
    // 造成5点{SPRITE_PRESET#2106}<color=#FFE699FF>岩元素伤害</color>，本角色附属<color=#FFFFFFFF>怒目鬼王</color>。
  }
}

register(AratakiItto);
