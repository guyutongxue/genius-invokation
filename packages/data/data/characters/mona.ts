
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1203,
  health: 10,
  energy: 3,
  tags: ["hydro", "catalyst", "mondstadt"],
})
class Mona {
  
  @Normal
  @Hydro(1)
  @Void(2)
  rippleOfFate(c: Context) {
    // 造成1点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>。
  }
  
  @Skill
  @Hydro(3)
  mirrorReflectionOfDoom(c: Context) {
    // 造成1点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，召唤<color=#FFFFFFFF>虚影</color>。
  }
  
  @Burst
  @Hydro(3)
  @Energy(3)
  stellarisPhantasm(c: Context) {
    // 造成4点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，生成<color=#FFFFFFFF>泡影</color>。
  }
  
  // @Passive
  // illusoryTorrent(c: Context) {
  //   // 【被动】<color=#FFFFFFFF>此角色为出战角色，我方执行「切换角色」行动时：</color>将此次切换视为「<color=#FFFFFFFF>快速行动</color>」而非「<color=#FFFFFFFF>战斗行动</color>」。（每回合1次）
  // }
}

register(Mona);
