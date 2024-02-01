import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 121023
 * @name 冰封的炽炎魔女
 * @description
 * 行动阶段开始时：如果所附属角色生命值不多于15，则移除此效果。
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到1点生命值。
 * 此效果被移除时：所附属角色转换为「焚尽的炽炎魔女」形态。
 */
export const _121023 = status(121023)
  .done();

/**
 * @id 121024
 * @name 冰封的炽炎魔女
 * @description
 * 行动阶段开始时：如果所附属角色生命值不多于25，则移除此效果。
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到1点生命值。
 * 此效果被移除时：所附属角色转换为「焚尽的炽炎魔女」形态。
 */
export const _121024 = status(121024)
  .done();

/**
 * @id 121021
 * @name 冰封的炽炎魔女
 * @description
 * 行动阶段开始时：如果所附属角色生命值不多于4，则移除此效果。
 * 所附属角色被击倒时：移除此效果，使角色免于被击倒，并治疗该角色到1点生命值。
 * 此效果被移除时：所附属角色转换为「焚尽的炽炎魔女」形态。
 */
export const IcesealedCrimsonWitchOfEmbers = status(121021)
  // TODO
  .done();

/**
 * @id 121022
 * @name 严寒
 * @description
 * 结束阶段：对附属角色造成1点冰元素伤害。
 * 可用次数：1
 * 所附属角色被附属炽热时，移除此效果。
 */
export const SheerCold = status(121022)
  // TODO
  .done();

/**
 * @id 121025
 * @name 寒炽弥漫
 * @description
 * 结束阶段：如果对方场上的「女士」已转换为「焚尽的炽炎魔女」，则对我方出战角色附属炽热。如果未转换，则对我方出战角色附属严寒，并使对方场上的「女士」失去1点充能。
 */
export const IncandescentFrostPermeating = combatStatus(121025)
  // TODO
  .done();

/**
 * @id 21021
 * @name 霜锋霰舞
 * @description
 * 造成1点冰元素伤害。
 */
export const FrostbladeHailstorm = skill(21021)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 21022
 * @name 凛冽之刺
 * @description
 * 造成2点冰元素伤害，目标角色附属严寒。
 */
export const BitingShards = skill(21022)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 21023
 * @name 红莲冰茧
 * @description
 * 造成4点冰元素伤害，治疗本角色2点。移除冰封的炽炎魔女，本角色永久转换为「焚尽的炽炎魔女」形态。
 */
export const CarmineChrysalis = skill(21023)
  .type("burst")
  .costCryo(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 21024
 * @name 邪眼之威
 * @description
 * 【被动】战斗开始时，初始附属冰封的炽炎魔女。
 */
export const MightOfDelusion = skill(21024)
  .type("passive")
  // TODO
  .done();

/**
 * @id 21025
 * @name 炽炎醒燃
 * @description
 * 
 */
export const InfernosAwakening = skill(21025)
  // .type("undefined")
  // TODO
  .done();

/**
 * @id 2102
 * @name 「女士」
 * @description
 * 瞳仁中倒映着破晓的赤红，她最后展开烈焰之翼向黎明飞去。
 * 「但那并不是曙光，亲爱的罗莎琳。那是焚尽一切的火海。」
 * 但这也没什么所谓。因为她心中明白，自己早已被烈火吞没。
 */
export const LaSignora = character(2102)
  .tags("cryo", "fatui")
  .health(10)
  .energy(2)
  .skills(FrostbladeHailstorm, BitingShards, CarmineChrysalis, MightOfDelusion, InfernosAwakening)
  .done();

/**
 * @id 221021
 * @name 苦痛奉还
 * @description
 * 我方出战角色为「女士」时，才能打出：入场时，生成3个「女士」当前元素类型的元素骰。
 * 角色受到至少为3点的伤害时：抵消1点伤害，然后根据「女士」的形态对敌方出战角色附属严寒或炽热。（每回合1次）
 * （牌组中包含「女士」，才能加入牌组）
 */
export const PainForPain = card(221021)
  .costSame(3)
  .talent(LaSignora)
  // TODO
  .done();
