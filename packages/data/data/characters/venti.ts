
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1503,
  health: 10,
  energy: 2,
  tags: ["anemo", "bow", "mondstadt"],
})
class Venti {
  
  @Normal
  @Anemo(1)
  @Void(2)
  divineMarksmanship(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Anemo(3)
  skywardSonnet(c: Context) {
    // 造成2点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>，生成<color=#FFFFFFFF>风域</color>。
  }
  
  @Burst
  @Anemo(3)
  @Energy(2)
  windSGrandOde(c: Context) {
    // 造成2点{SPRITE_PRESET#2105}<color=#80FFD7FF>风元素伤害</color>，召唤<color=#FFFFFFFF>暴风之眼</color>。
  }
}

register(Venti);
