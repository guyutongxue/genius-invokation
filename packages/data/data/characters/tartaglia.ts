
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 1204,
  health: 10,
  energy: 3,
  tags: ["hydro", "bow", "fatui"],
})
class Tartaglia {
  
  @Normal
  @Hydro(1)
  @Void(2)
  cuttingTorrent(c: Context) {
    // 造成2点{SPRITE_PRESET#2100}<color=#FFFFFFFF>物理伤害</color>。
  }
  
  @Skill
  @Hydro(3)
  foulLegacyRagingTide(c: Context) {
    // 切换为<color=#FFFFFFFF>近战状态</color>，然后造成2点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>。
  }
  
  @Burst
  @Hydro(3)
  @Energy(3)
  havocObliteration(c: Context) {
    // 依据<color=#FFFFFFFF>达达利亚</color>当前所处的状态，进行不同的攻击：\n<color=#FFFFFFFF>远程状态·魔弹一闪：</color>造成4点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>，返还2点<color=#FFFFFFFF>{SPRITE_PRESET#1110}充能</color>，目标角色附属<color=#FFFFFFFF>断流</color>。\n<color=#FFFFFFFF>近战状态·尽灭水光：</color>造成4点{SPRITE_PRESET#2102}<color=#80C0FFFF>水元素伤害</color>。
  }
  
  // @Passive
  // tideWithholder(c: Context) {
  //   // 【被动】战斗开始时，初始附属<color=#FFFFFFFF>远程状态</color>。\n角色所附属的<color=#FFFFFFFF>近战状态</color>效果结束时，重新附属<color=#FFFFFFFF>远程状态</color>。
  // }
  
  // @Passive
  // rangedStance(c: Context) {
  //   // 
  // }
  
  // @Passive
  // tideWithholder(c: Context) {
  //   // 
  // }
}

register(Tartaglia);
