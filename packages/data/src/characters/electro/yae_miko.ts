import { character, skill, summon, status, combatStatus, card, DamageType } from "@gi-tcg/core/builder";

/**
 * @id 114081
 * @name 杀生樱
 * @description
 * 结束阶段：造成1点雷元素伤害；
 * 可用次数：3（可叠加，最多叠加到6次）
 * 我方宣布结束时：如果此牌的可用次数至少为4，则造成1点雷元素伤害。（需消耗可用次数）
 */
const SesshouSakura = summon(114081)
  // TODO
  .done();

/**
 * @id 114082
 * @name 遣役之仪
 * @description
 * 本回合中，所附属角色下次施放野干役咒·杀生樱时少花费2个元素骰。
 */
const RiteOfDispatch = status(114082)
  // TODO
  .done();

/**
 * @id 114083
 * @name 天狐霆雷
 * @description
 * 我方选择行动前：造成3点雷元素伤害。
 * 可用次数：1
 */
const TenkoThunderbolts = combatStatus(114083)
  // TODO
  .done();

/**
 * @id 14081
 * @name 狐灵食罪式
 * @description
 * 造成1点雷元素伤害。
 */
const SpiritfoxSineater = skill(14081)
  .type("normal")
  .costElectro(1)
  .costVoid(2)
  // TODO
  .done();

/**
 * @id 14082
 * @name 野干役咒·杀生樱
 * @description
 * 召唤杀生樱。
 */
const YakanEvocationSesshouSakura = skill(14082)
  .type("elemental")
  .costElectro(3)
  // TODO
  .done();

/**
 * @id 14083
 * @name 大密法·天狐显真
 * @description
 * 造成4点雷元素伤害；如果我方场上存在杀生樱，则将其消灭，然后生成天狐霆雷。
 */
const GreatSecretArtTenkoKenshin = skill(14083)
  .type("burst")
  .costElectro(3)
  .costEnergy(2)
  // TODO
  .done();

/**
 * @id 1408
 * @name 八重神子
 * @description
 * 「兼具智慧与美貌的八重神子大人」
 */
const YaeMiko = character(1408)
  .tags("electro", "catalyst", "inazuma")
  .health(10)
  .energy(2)
  .skills(SpiritfoxSineater, YakanEvocationSesshouSakura, GreatSecretArtTenkoKenshin)
  .done();

/**
 * @id 214081
 * @name 神篱之御荫
 * @description
 * 战斗行动：我方出战角色为八重神子时，装备此牌。
 * 八重神子装备此牌后，立刻使用一次大密法·天狐显真。
 * 装备有此牌的八重神子通过大密法·天狐显真消灭了杀生樱后：本回合下次使用野干役咒·杀生樱时少花费2个元素骰。
 * （牌组中包含八重神子，才能加入牌组）
 */
const TheShrinesSacredShade = card(214081)
  .costElectro(3)
  .costEnergy(2)
  .talentOf(YaeMiko)
  .equipment()
  // TODO
  .done();
