import { character, skill, summon, status, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114071
 * @name 雷罚恶曜之眼
 * @description
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：3
 * 此召唤物在场时：我方角色「元素爆发」造成的伤害+1。
 */
const EyeOfStormyJudgment = summon(114071)
  // TODO
  .done();

/**
 * @id 114072
 * @name 诸愿百眼之轮
 * @description
 * 其他我方角色使用「元素爆发」后：累积1点「愿力」。（最多累积3点）
 * 所附属角色使用奥义·梦想真说时：消耗所有「愿力」，每点「愿力」使造成的伤害+1。
 */
const ChakraDesiderataStatus = status(114072)
  // TODO
  .done();

/**
 * @id 14071
 * @name 源流
 * @description
 * 造成2点物理伤害。
 */
const Origin = skill(14071)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14072
 * @name 神变·恶曜开眼
 * @description
 * 召唤雷罚恶曜之眼。
 */
const TranscendenceBalefulOmen = skill(14072)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14073
 * @name 奥义·梦想真说
 * @description
 * 造成3点雷元素伤害，其他我方角色获得2点充能。
 */
const SecretArtMusouShinsetsu = skill(14073)
  .type("burst")
  .costElectro(4)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 14074
 * @name 诸愿百眼之轮
 * @description
 * 【被动】战斗开始时，初始附属诸愿百眼之轮。
 */
const ChakraDesiderata = skill(14074)
  .type("passive")
  // TODO
  .done();

/**
 * @id 1407
 * @name 雷电将军
 * @description
 * 鸣雷寂灭，浮世泡影。
 */
const RaidenShogun = character(1407)
  .tags("electro", "pole", "inazuma")
  .skills(Origin, TranscendenceBalefulOmen, SecretArtMusouShinsetsu, ChakraDesiderata)
  .done();

/**
 * @id 214071
 * @name 万千的愿望
 * @description
 * 战斗行动：我方出战角色为雷电将军时，装备此牌。
 * 雷电将军装备此牌后，立刻使用一次奥义·梦想真说。
 * 装备有此牌的雷电将军使用奥义·梦想真说时：每消耗1点「愿力」，都使造成的伤害额外+1。
 * （牌组中包含雷电将军，才能加入牌组）
 */
const WishesUnnumbered = card(214071)
  .costElectro(4)
  .costEnergy(2)
  .talentOf(RaidenShogun)
  .equipment()
  // TODO
  .done();
