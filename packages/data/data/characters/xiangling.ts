
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1302,
  health: 10,
  energy: 2,
  tags: ["pyro", "pole", "liyue"],
})
class Xiangling {
  
  @Normal
  @Pyro(1)
  @Void(2)
  doughFu(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Pyro(3)
  guobaAttack(c: Context) {
    // 召唤<color=#FFFFFFFF>锅巴</color>。
  }
  
  @Burst
  @Pyro(4)
  @Energy(2)
  pyronado(c: Context) {
    // 造成2点{SPRITE_PRESET#2103}<color=#FF9999FF>火元素伤害</color>，生成<color=#FFFFFFFF>旋火轮</color>。
  }
}

register(Xiangling);
