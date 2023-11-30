import { character, skill, summon, status, card, DamageType } from "@gi-tcg";

/**
 * @id 114092
 * @name 蔷薇雷光
 * @description
 * 结束阶段：造成2点雷元素伤害。
 * 可用次数：2
 */
const LightningRoseSummon = summon(114092)
  // TODO
  .done();

/**
 * @id 114091
 * @name 引雷
 * @description
 * 此状态初始具有2层「引雷」；重复附属时，叠加1层「引雷」。「引雷」最多可以叠加到4层。
 * 结束阶段：叠加1层「引雷」。
 * 所附属角色受到苍雷伤害时：移除此状态，每层「引雷」使此伤害+1。
 */
const Conductive = status(114091)
  // TODO
  .done();

/**
 * @id 14091
 * @name 指尖雷暴
 * @description
 * 造成1点雷元素伤害；
 * 如果此技能为重击，则使敌方出战角色附属引雷。
 */
const LightningTouch = skill(14091)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14092
 * @name 苍雷
 * @description
 * 造成2点雷元素伤害；如果敌方出战角色未附属引雷，则使其附属引雷。
 */
const VioletArc = skill(14092)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14093
 * @name 蔷薇的雷光
 * @description
 * 造成2点雷元素伤害，召唤蔷薇雷光。
 */
const LightningRose = skill(14093)
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1409
 * @name 丽莎
 * @description
 * 追寻魔导的奥秘，静待真相的机缘。
 */
const Lisa = character(1409)
  .tags("electro", "catalyst", "mondstadt")
  .skills(LightningTouch, VioletArc, LightningRose)
  .done();

/**
 * @id 214091
 * @name 脉冲的魔女
 * @description
 * 切换到装备有此牌的丽莎后：使敌方出战角色附属引雷。（每回合1次）
 * （牌组中包含丽莎，才能加入牌组）
 */
const PulsatingWitch = card(214091, "character")
  .costElectro(1)
  .talentOf(Lisa)
  .equipment()
  // TODO
  .done();
