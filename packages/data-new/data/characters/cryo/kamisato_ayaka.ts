import { character, skill, summon, status, card, DamageType } from "@gi-tcg";

/**
 * @id 111051
 * @name 霜见雪关扉
 * @description
 * 结束阶段：造成2点冰元素伤害。
 * 可用次数：2
 */
const FrostflakeSekiNoTo = summon(111051)
  // TODO
  .done();

/**
 * @id 111053
 * @name 冰元素附魔
 * @description
 * 所附属角色造成的物理伤害变为冰元素伤害，且角色造成的冰元素伤害+1。
 * （持续到回合结束）
 */
const CryoElementalInfusion01 = status(111053)
  // TODO
  .done();

/**
 * @id 111052
 * @name 冰元素附魔
 * @description
 * 所附属角色造成的物理伤害变为冰元素伤害。
 * （持续到回合结束）
 */
const CryoElementalInfusion = status(111052)
  // TODO
  .done();

/**
 * @id 11051
 * @name 神里流·倾
 * @description
 * 造成2点物理伤害。
 */
const KamisatoArtKabuki = skill(11051)
  .type("normal")
  .costCryo(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 11052
 * @name 神里流·冰华
 * @description
 * 造成3点冰元素伤害。
 */
const KamisatoArtHyouka = skill(11052)
  .type("elemental")
  .costCryo(3)
  // TODO
  .done();

/**
 * @id 11053
 * @name 神里流·霜灭
 * @description
 * 造成4点冰元素伤害，召唤霜见雪关扉。
 */
const KamisatoArtSoumetsu = skill(11053)
  .type("burst")
  .costCryo(3)
  .costEnergy(3)
  // TODO
  .done();

/**
 * @id 11054
 * @name 神里流·霰步
 * @description
 * 【被动】此角色被切换为「出战角色」时，附属冰元素附魔。
 */
const KamisatoArtSenho = skill(11054)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1105
 * @name 神里绫华
 * @description
 * 如霜凝华，如鹭在庭。
 */
const KamisatoAyaka = character(1105)
  .tags("cryo", "sword", "inazuma")
  .skills(KamisatoArtKabuki, KamisatoArtHyouka, KamisatoArtSoumetsu, KamisatoArtSenho)
  .done();

/**
 * @id 211051
 * @name 寒天宣命祝词
 * @description
 * 装备有此牌的神里绫华生成的冰元素附魔会使所附属角色造成的冰元素伤害+1。
 * 切换到装备有此牌的神里绫华时：少花费1个元素骰。（每回合1次）
 * （牌组中包含神里绫华，才能加入牌组）
 */
const KantenSenmyouBlessing = card(211051, "character")
  .costCryo(2)
  .talentOf(KamisatoAyaka)
  .equipment()
  // TODO
  .done();
