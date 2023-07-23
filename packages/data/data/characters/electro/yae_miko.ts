import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, DiceType } from "@gi-tcg";

/**
 * **狐灵食罪式**
 * 造成1点雷元素伤害。
 */
const SpiritfoxSineater = createSkill(14081)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Electro)
  .build();

/**
 * **杀生樱**
 * 结束阶段：造成1点雷元素伤害；
 * 可用次数：3（可叠加，最多叠加到6次）
 * 我方宣布结束时：如果此牌的可用次数至少为4，则造成1点雷元素伤害。（需消耗可用次数）
 */
const SesshouSakura = createSummon(114081)
  .withUsage(3, 6)
  .on("endPhase", (c) => c.dealDamage(1, DamageType.Electro))
  .on("declareEnd", (c) => c.dealDamage(1, DamageType.Electro))
  .build();

/**
 * **野干役咒·杀生樱**
 * 召唤杀生樱。
 */
const YakanEvocationSesshouSakura = createSkill(14082)
  .setType("elemental")
  .costElectro(3)
  .summon(SesshouSakura)
  .build();

/**
 * **遣役之仪**
 * 本回合中，所附属角色下次施放野干役咒·杀生樱时少花费2个元素骰。
 */
const RiteOfDispatch = createStatus(114082)
  .withDuration(1)
  .withUsage(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.id === YakanEvocationSesshouSakura) {
      c.deductCost(DiceType.Electro, DiceType.Electro);
    }
    return false;
  })
  .build();

/**
 * **天狐霆雷**
 * 我方选择行动前：造成3点雷元素伤害。
 * 可用次数：1
 */
const TenkoThunderbolts = createStatus(114083)
  .withUsage(1)
  .on("beforeAction", (c) => c.dealDamage(3, DamageType.Electro))
  .build();

/**
 * **大密法·天狐显真**
 * 造成4点雷元素伤害；如果我方场上存在杀生樱，则将其消灭，然后生成天狐霆雷。
 */
const GreatSecretArtTenkoKenshin = createSkill(14083)
  .setType("burst")
  .costElectro(3)
  .costEnergy(2)
  .do((c) => {
    c.dealDamage(4, DamageType.Electro);
    const sakura = c.findSummon(SesshouSakura);
    if (sakura) {
      sakura.dispose();
      c.createCombatStatus(TenkoThunderbolts);
      if (c.character.hasEquipment(TheShrinesSacredShade)) {
        c.createStatus(RiteOfDispatch);
      }
    }
  })
  .build();

export const YaeMiko = createCharacter(1408)
  .addTags("electro", "catalyst", "inazuma")
  .maxEnergy(2)
  .addSkills(SpiritfoxSineater, YakanEvocationSesshouSakura, GreatSecretArtTenkoKenshin)
  .build();

/**
 * **神篱之御荫**
 * 战斗行动：我方出战角色为八重神子时，装备此牌。
 * 八重神子装备此牌后，立刻使用一次大密法·天狐显真。
 * 装备有此牌的八重神子通过大密法·天狐显真消灭了杀生樱后，本回合下次使用野干役咒·杀生樱时少花费2个元素骰。
 * （牌组中包含八重神子，才能加入牌组）
 */
export const TheShrinesSacredShade = createCard(214081, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(YaeMiko)
  .addCharacterFilter(YaeMiko)
  .costElectro(3)
  .costEnergy(2)
  .useSkill(GreatSecretArtTenkoKenshin)
  .buildToEquipment()
  .build();
