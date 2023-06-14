
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2501,
  health: 10,
  energy: 3,
  tags: ["anemo", "monster"],
})
class MaguuKenki {
  
  @Normal
  @Anemo(1)
  @Void(2)
  ichimonji(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Anemo(3)
  blusteringBlade(c: Context) {
    // 召唤<color=#FFFFFFFF>剑影·孤风</color>。
  }
  
  @Skill
  @Cryo(3)
  frostyAssault(c: Context) {
    // 召唤<color=#FFFFFFFF>剑影·霜驰</color>。
  }
  
  @Burst
  @Anemo(3)
  @Energy(3)
  pseudoTenguSweeper(c: Context) {
    // 造成4点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>，触发所有我方<color=#FFFFFFFF>剑影</color>召唤物的效果。（不消耗其可用次数）
  }
}

register(MaguuKenki);
