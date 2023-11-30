import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType, SummonHandle } from "@gi-tcg";

/**
 * **西风剑术·宗室**
 * 造成2点物理伤害。
 */
const FavoniusBladeworkEdel = createSkill(11061)
  .setType("normal")
  .costCryo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

const GrimHeart = createStatus(111061)
  .on("beforeSkillDamage",
    (c) => c.sourceSkill.info.id === IcetideVortex,
    (c) => { c.dealDamage(2, DamageType.Cryo); })
  .on("useSkill",
    (c) => c.info.id === IcetideVortex,
    (c) => { c.this.dispose(); })
  .build();

/**
 * **冰潮的涡旋**
 * 造成2点冰元素伤害，如果本角色未附属冷酷之心，则使其附属冷酷之心。
 */
const IcetideVortex = createSkill(11062)
  .setType("elemental")
  .costCryo(3)
  .dealDamage(2, DamageType.Cryo)
  .do((c) => {
    if (!c.character.findStatus(GrimHeart)) {
      c.character.createStatus(GrimHeart);
    }
  })
  .build();

/**
 * **光降之剑**
 * "优菈使用「普通攻击」或「元素战技」时：此牌累积2点「能量层数」，但是优菈不会获得充能。
 * 结束阶段：弃置此牌，造成3点物理伤害；每有1点「能量层数」，都使此伤害+1。
 * （影响此牌「可用次数」的效果会作用于「能量层数」。）
 */
const LightFallSword: SummonHandle = createSummon(111062)
  .withUsage(0)
  .noDispose()
  .on("useSkill",
    (c) => c.character.info.id === Eula
      && (c.info.type === "normal" || c.info.type === "elemental"),
    (c) => {
      c.character.loseEnergy(1);
      c.this.setUsage(c.this.usage + 2);
      if (c.info.id === IcetideVortex && c.character.findEquipment(WellspringOfWarlust)) {
        c.this.setUsage(c.this.usage + 1);
      }
    })
  .on("endPhase", (c) => {
    c.dealDamage(c.this.usage + 3, DamageType.Physical);
    c.this.dispose();
  })
  .build();

/**
 * **凝浪之光剑**
 * 造成2点冰元素伤害，召唤光降之剑。
 */
const GlacialIllumination = createSkill(11063)
  .setType("burst")
  .costCryo(3)
  .costEnergy(2)
  .dealDamage(2, DamageType.Cryo)
  .summon(LightFallSword)
  .build();

export const Eula = createCharacter(1106)
  .addTags("cryo", "claymore", "mondstadt")
  .maxEnergy(2)
  .addSkills(FavoniusBladeworkEdel, IcetideVortex, GlacialIllumination)
  .build();

/**
 * **战欲涌现**
 * 战斗行动：我方出战角色为优菈时，装备此牌。
 * 优菈装备此牌后，立刻使用一次凝浪之光剑。
 * 装备有此牌的优菈使用冰潮的涡旋时，会额外为光降之剑累积1点「能量层数」。
 * （牌组中包含优菈，才能加入牌组）
 */
export const WellspringOfWarlust = createCard(211061, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Eula)
  .addCharacterFilter(Eula)
  .costCryo(3)
  .costEnergy(2)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(GlacialIllumination); })
  .build();
