import { character, skill, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114052
 * @name 奔潮引电
 * @description
 * 本回合内，所附属的角色普通攻击少花费1个无色元素。
 * 可用次数：2
 */
const SummonerOfLightning = status(114052)
  // TODO
  .done();

/**
 * @id 114051
 * @name 捉浪·涛拥之守
 * @description
 * 本角色将在下次行动时，直接使用技能：踏潮。
 * 准备技能期间：提供2点护盾，保护所附属的角色。
 */
const TidecallerSurfEmbrace = status(114051)
  // TODO
  .done();

/**
 * @id 114053
 * @name 雷兽之盾
 * @description
 * 我方角色普通攻击后：造成1点雷元素伤害。
 * 我方角色受到至少为3的伤害时：抵消其中1点伤害。
 * 持续回合：2
 */
const ThunderbeastsTarge = combatStatus(114053)
  // TODO
  .done();

/**
 * @id 14051
 * @name 征涛
 * @description
 * 造成2点物理伤害。
 */
const Oceanborne = skill(14051)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14052
 * @name 捉浪
 * @description
 * 本角色附属捉浪·涛拥之守并准备技能：踏潮。
 */
const Tidecaller = skill(14052)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14053
 * @name 斫雷
 * @description
 * 造成2点雷元素伤害，生成雷兽之盾。
 */
const Stormbreaker = skill(14053)
  .type("burst")
  .costElectro(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 14054
 * @name 踏潮
 * @description
 * （需准备1个行动轮）
 * 造成3点雷元素伤害。
 */
const Wavestrider = skill(14054)
  .type("elemental")
  // TODO
  .done();

/**
 * @id 1405
 * @name 北斗
 * @description
 * 「记住这一天，你差点赢了南十字船队老大的钱。」
 */
const Beidou = character(1405)
  .tags("electro", "claymore", "liyue")
  .health(10)
  .energy(3)
  .skills(Oceanborne, Tidecaller, Stormbreaker, Wavestrider)
  .done();

/**
 * @id 214051
 * @name 霹雳连霄
 * @description
 * 战斗行动：我方出战角色为北斗时，装备此牌。
 * 北斗装备此牌后，立刻使用一次捉浪。
 * 装备有此牌的北斗使用踏潮后：使北斗本回合内「普通攻击」少花费1个无色元素。（最多触发2次）
 * （牌组中包含北斗，才能加入牌组）
 */
const LightningStorm = card(214051)
  .costElectro(3)
  .talent(Beidou)
  // TODO
  .done();
