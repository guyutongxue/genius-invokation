
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1105,
  health: 10,
  energy: 3,
  tags: ["cryo", "sword", "inazuma"],
})
class KamisatoAyaka {
  
  @Normal
  @Cryo(1)
  @Void(2)
  kamisatoArtKabuki(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Cryo(3)
  kamisatoArtHyouka(c: Context) {
    // 造成3点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>。
  }
  
  @Burst
  @Cryo(3)
  @Energy(3)
  kamisatoArtSoumetsu(c: Context) {
    // 造成4点{SPRITE_PRESET#2101}<color=#99FFFFFF>冰元素伤害</color>，召唤<color=#FFFFFFFF>霜见雪关扉</color>。
  }
  
  // @Passive
  // kamisatoArtSenho(c: Context) {
  //   // 【被动】此角色被切换为「出战角色」时，附属<color=#FFFFFFFF>冰元素附魔</color>。
  // }
}

register(KamisatoAyaka);
