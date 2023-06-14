
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1106,
  health: 10,
  energy: 2,
  tags: ["cryo", "claymore", "mondstadt"],
})
class Eula {
  
  @Normal
  @Cryo(1)
  @Void(2)
  favoniusBladeworkEdel(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Cryo(3)
  icetideVortex(c: Context) {
    // 造成2点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，如果本角色未附属<color=#FFFFFFFF>冷酷之心</color>，则使其附属<color=#FFFFFFFF>冷酷之心</color>。
  }
  
  @Burst
  @Cryo(3)
  @Energy(2)
  glacialIllumination(c: Context) {
    // 造成2点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，召唤<color=#FFFFFFFF>光降之剑</color>。
  }
}

register(Eula);
