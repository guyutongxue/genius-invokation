
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1101,
  health: 10,
  energy: 3,
  tags: ["cryo", "bow", "liyue"],
})
class Ganyu {
  
  @Normal
  @Cryo(1)
  @Void(2)
  liutianArchery(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Cryo(3)
  trailOfTheQilin(c: Context) {
    // 造成1点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，生成<color=#FFFFFFFF>冰莲</color>。
  }
  
  @Normal
  @Cryo(5)
  frostflakeArrow(c: Context) {
    // 造成2点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，对所有敌方后台角色造成<color=#FFFFFFFF>2点<color=#FFFFFFFF>穿透伤害</color></color>。
  }
  
  @Burst
  @Cryo(3)
  @Energy(3)
  celestialShower(c: Context) {
    // 造成2点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，对所有敌方后台角色造成<color=#FFFFFFFF>1点<color=#FFFFFFFF>穿透伤害</color></color>，召唤<color=#FFFFFFFF>冰灵珠</color>。
  }
}

register(Ganyu);
