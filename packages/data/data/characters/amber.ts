
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1304,
  health: 10,
  energy: 2,
  tags: ["pyro", "bow", "mondstadt"],
})
class Amber {
  
  @Normal
  @Pyro(1)
  @Void(2)
  sharpshooter(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Pyro(3)
  explosivePuppet(c: Context) {
    // 召唤<color=#FFFFFFFF>兔兔伯爵</color>。
  }
  
  @Burst
  @Pyro(3)
  @Energy(2)
  fieryRain(c: Context) {
    // 造成2点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>，对所有敌方后台角色造成2点<color=#FFFFFFFF><color=#FFFFFFFF>穿透伤害</color></color>。
  }
}

register(Amber);
