import { createCard, createCharacter, createSkill, createStatus, DamageType } from "@gi-tcg";

/**
 * **七圣枪术**
 * 造成2点物理伤害。
 */
const InvokersSpear = createSkill(14041)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **秘仪·律渊渡魂**
 * 造成3点雷元素伤害。
 */
const SecretRiteChasmicSoulfarer = createSkill(14042)
  .setType("elemental")
  .costElectro(3)
  .do((c) => {
    if (c.character.hasEquipment(FeatherfallJudgment)) {
      const indwelling = c.character.hasStatus(PactswornPathclearer)?.getVisibleValue();
      if (indwelling === 3 || indwelling === 5) {
        c.dealDamage(4, DamageType.Electro);
      } else {
        c.dealDamage(3, DamageType.Electro);
      }
    } else {
      c.dealDamage(3, DamageType.Electro);
    }
  })
  .build();

/**
 * **圣仪·煟煌随狼行**
 * 造成4点雷元素伤害，
 * 启途誓使的[凭依]级数+2。
 */
const SacredRiteWolfsSwiftness = createSkill(14043)
  .setType("burst")
  .costElectro(4)
  .costEnergy(2)
  .do((c) => {
    c.dealDamage(4, DamageType.Electro);
    const status = c.character.hasStatus(PactswornPathclearer);
    if (!status) return;
    status.addVisibleValue(2);
    if (status.getVisibleValue()! >= 6) {
      status.addVisibleValue(-4);
    }
  })
  .build();

/**
 * **启途誓使**
 * 结束阶段：累积1级「凭依」。
 * 根据「凭依」级数，提供效果：
 * 大于等于2级：物理伤害转化为雷元素伤害；
 * 大于等于4级：造成的伤害+2；
 * 大于等于6级时：「凭依」级数-4。
 */
const PactswornPathclearer = createStatus(114041)
  .do({
    onEndPhase(c) {
      this.indwelling++;
      if (this.indwelling >= 6) {
        this.indwelling -= 4;
      }
    },
    onEarlyBeforeDealDamage(c) {
      if (this.indwelling >= 2 && c.damageType === DamageType.Physical) {
        c.changeDamageType(DamageType.Electro);
      }
      if (this.indwelling >= 4) {
        c.addDamage(2);
      }
    },
  }, { indwelling: 0 })
  .build();

/**
 * **行度誓惩**
 * 【被动】战斗开始时，初始附属启途誓使。
 */
const LawfulEnforcer = createSkill(14044)
  .setType("passive")
  .on("enter", (c) => { c.createStatus(PactswornPathclearer); })
  .build();

export const Cyno = createCharacter(1404)
  .addTags("electro", "pole", "sumeru")
  .maxEnergy(2)
  .addSkills(InvokersSpear, SecretRiteChasmicSoulfarer, SacredRiteWolfsSwiftness, LawfulEnforcer)
  .build();

/**
 * **落羽的裁择**
 * 战斗行动：我方出战角色为赛诺时，装备此牌。
 * 赛诺装备此牌后，立刻使用一次秘仪·律渊渡魂。
 * 装备有此牌的赛诺在启途誓使的「凭依」级数为3或5时使用秘仪·律渊渡魂时，造成的伤害额外+1。
 * （牌组中包含赛诺，才能加入牌组）
 */
export const FeatherfallJudgment = createCard(214041, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Cyno)
  .addCharacterFilter(Cyno)
  .costElectro(3)
  .useSkill(SecretRiteChasmicSoulfarer)
  .buildToEquipment()
  .build();
