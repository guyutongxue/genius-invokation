import { character, skill, summon, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 124023
 * @name 轰雷禁锢
 * @description
 * 结束阶段：对附属有雷鸣探知的敌方角色造成3点雷元素伤害。（如果敌方不存在符合条件角色，则改为对出战角色造成伤害）
 * 可用次数：1
 */
const ThunderingShacklesSummon = summon(124023)
  // TODO
  .done();

/**
 * @id 124022
 * @name 雷鸣探知
 * @description
 * 此状态存在期间，可以触发1次：所附属角色受到雷音权现及其召唤物造成的伤害+1。
 * （同一方场上最多存在一个此状态。雷音权现的部分技能，会以所附属角色为目标。）
 */
const LightningRod = status(124022)
  // TODO
  .done();

/**
 * @id 124021
 * @name 雷霆探针
 * @description
 * 所在阵营角色使用技能后：对所在阵营出战角色附属雷鸣探知。（每回合1次）
 */
const LightningStrikeProbe = combatStatus(124021)
  // TODO
  .done();

/**
 * @id 124024
 * @name 滚雷裂音
 * @description
 * 我方对附属有雷鸣探知的角色造成的伤害+1。
 */
const RollingThunder = combatStatus(124024)
  // TODO
  .done();

/**
 * @id 24021
 * @name 轰霆翼斩
 * @description
 * 造成1点雷元素伤害。
 */
const ThunderousWingslash = skill(24021)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 24022
 * @name 雷墙倾轧
 * @description
 * 对附属有雷鸣探知的敌方角色造成3点雷元素伤害。（如果敌方不存在符合条件角色，则改为对出战角色造成伤害）
 */
const StrifefulLightning = skill(24022)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 24023
 * @name 轰雷禁锢
 * @description
 * 造成2点雷元素伤害，召唤轰雷禁锢。
 */
const ThunderingShackles = skill(24023)
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 24024
 * @name 雷霆探知
 * @description
 * 【被动】战斗开始时，在敌方场上生成雷霆探针。
 */
const LightningProbe = skill(24024)
  .type("passive")
  // TODO
  .done();

/**
 * @id 2402
 * @name 雷音权现
 * @description
 * 只要土地中的怨恨不消，那雷鸣也不会断绝吧。
 */
const ThunderManifestation = character(2402)
  .tags("electro", "monster")
  .health(10)
  .energy(2)
  .skills(ThunderousWingslash, StrifefulLightning, ThunderingShackles, LightningProbe)
  .done();

/**
 * @id 224021
 * @name 悲号回唱
 * @description
 * 装备有此牌的雷音权现在场，附属有雷鸣探知的敌方角色受到伤害时：我方抓1张牌。（每回合1次）
 * （牌组中包含雷音权现，才能加入牌组）
 */
const GrievingEcho = card(224021)
  .costElectro(3)
  .talent(ThunderManifestation)
  // TODO
  .done();
