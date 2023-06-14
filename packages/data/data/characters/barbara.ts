
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1201,
  health: 10,
  energy: 3,
  tags: ["hydro", "catalyst", "mondstadt"],
})
class Barbara {
  
  @Normal
  @Hydro(1)
  @Void(2)
  whisperOfWater(c: Context) {
    // 造成1点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>。
  }
  
  @Skill
  @Hydro(3)
  letTheShowBegin(c: Context) {
    // 造成1点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，召唤<color=#FFFFFFFF>歌声之环</color>。
  }
  
  @Burst
  @Hydro(3)
  @Energy(3)
  shiningMiracle(c: Context) {
    // 治疗所有我方角色4点。
  }
}

register(Barbara);
