
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2202,
  health: 10,
  energy: 2,
  tags: ["hydro", "fatui"],
})
class MirrorMaiden {
  
  @Normal
  @Hydro(1)
  @Void(2)
  waterBall(c: Context) {
    // 造成1点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>。
  }
  
  @Skill
  @Hydro(3)
  influxBlast(c: Context) {
    // 造成2点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，目标角色附属<color=#FFFFFFFF>水光破镜</color>。
  }
  
  @Burst
  @Hydro(3)
  @Energy(2)
  rippledReflection(c: Context) {
    // 造成5点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>。
  }
}

register(MirrorMaiden);
