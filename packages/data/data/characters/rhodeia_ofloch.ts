
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2201,
  health: 10,
  energy: 3,
  tags: ["hydro", "monster"],
})
class RhodeiaOfLoch {
  
  @Normal
  @Hydro(1)
  @Void(2)
  surge(c: Context) {
    // 造成1点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>。
  }
  
  @Skill
  @Hydro(3)
  oceanidMimicSummoning(c: Context) {
    // 随机召唤1种<color=#FFFFFFFF>纯水幻形</color>。（优先生成不同的类型）
  }
  
  @Skill
  @Hydro(5)
  theMyriadWilds(c: Context) {
    // 随机召唤2种<color=#FFFFFFFF>纯水幻形</color>。（优先生成不同的类型）
  }
  
  @Burst
  @Hydro(3)
  @Energy(3)
  tideAndTorrent(c: Context) {
    // 造成2点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>；我方每有1个召唤物，再使此伤害+2。
  }
}

register(RhodeiaOfLoch);
