
import {
  Context,
  Character,
  Void, Pyro, Hydro, Dendro, Electro, Anemo, Cryo, Geo, Energy,
  Normal, Skill, Burst,
  register,
} from "@jenshin-tcg";

@Character({
  objectId: 2401,
  health: 8,
  energy: 2,
  tags: ["electro", "monster"],
})
class ElectroHypostasis {
  
  @Normal
  @Electro(1)
  @Void(2)
  electroCrystalProjection(c: Context) {
    // 造成1点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>。
  }
  
  @Skill
  @Electro(5)
  rockPaperScissorsCombo(c: Context) {
    // 造成2点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，然后分别<color=#FFFFFFFF>准备技能</color>：<color=#FFFFFFFF>猜拳三连击·剪刀</color>和<color=#FFFFFFFF>猜拳三连击·布</color>。
  }
  
  @Burst
  @Electro(3)
  @Energy(2)
  lightningLockdown(c: Context) {
    // 造成2点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，召唤<color=#FFFFFFFF>雷锁镇域</color>。
  }
  
  // @Passive
  // electroCrystalCore(c: Context) {
  //   // 【被动】战斗开始时，初始附属<color=#FFFFFFFF>雷晶核心</color>。
  // }
  
  @Skill
  rockPaperScissorsComboScissors(c: Context) {
    // 造成2点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>，然后<color=#FFFFFFFF>准备技能</color>：<color=#FFFFFFFF>猜拳三连击·布</color>。
  }
  
  @Skill
  rockPaperScissorsComboPaper(c: Context) {
    // 造成3点{SPRITE_PRESET#2104}<color=#FFACFFFF>雷元素伤害</color>。
  }
}

register(ElectroHypostasis);
