import { character, skill, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 115062
 * @name 倾落
 * @description
 * 所附属角色为出战角色，我方执行「切换角色」行动时：少花费1个元素骰；此效果触发后，造成1点风元素伤害。
 * 可用次数：1
 */
const Descent = status(115062)
  // TODO
  .done();

/**
 * @id 115061
 * @name 优风倾姿
 * @description
 * 所附属角色进行「普通攻击」时：造成的伤害+2；如果敌方存在后台角色，则此技能改为对下一个敌方后台角色造成伤害。
 * 可用次数：2
 */
const Windfavored = status(115061)
  // TODO
  .done();

/**
 * @id 15061
 * @name 行幡鸣弦
 * @description
 * 造成1点风元素伤害。
 */
const YuubanMeigen = skill(15061)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 15062
 * @name 羽画·风姿华歌
 * @description
 * 造成2点风元素伤害，本角色附属优风倾姿。
 */
const HanegaSongOfTheWind = skill(15062)
  .type("elemental")
  .costAnemo(3)
  // TODO
  .done();

/**
 * @id 15063
 * @name 狂言·式乐五番
 * @description
 * 造成7点风元素伤害；如果角色附属有优风倾姿，则将其移除并使此伤害+1。
 */
const KyougenFiveCeremonialPlays = skill(15063)
  .type("burst")
  .costAnemo(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 1506
 * @name 流浪者
 * @description
 * 千般劫渡，不可得知。
 */
const Wanderer = character(1506)
  .tags("anemo", "catalyst")
  .skills(YuubanMeigen, HanegaSongOfTheWind, KyougenFiveCeremonialPlays)
  .done();

/**
 * @id 215061
 * @name 梦迹一风
 * @description
 * 战斗行动：我方出战角色为REALNAME[ID(1)时，装备此牌。
 * #REALNAME[ID(1)装备此牌后，立刻使用一次羽画·风姿华歌。
 * 装备有此牌的#REALNAME[ID(1)在优风倾姿状态下进行重击后：下次从该角色执行「切换角色」行动时少花费1个元素骰，并且造成1点风元素伤害。
 * （牌组中包含#REALNAME[ID(1)，才能加入牌组）
 */
const GalesOfReverie = card(215061)
  .costAnemo(4)
  .talentOf(Wanderer)
  .equipment()
  // TODO
  .done();
