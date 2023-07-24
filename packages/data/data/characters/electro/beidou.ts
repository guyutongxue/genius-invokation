import { createCard, createCharacter, createSkill, createStatus, DamageType, DiceType } from "@gi-tcg";

/**
 * **征涛**
 * 造成2点物理伤害。
 */
const Oceanborne = createSkill(14051)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();


/**
 * **踏潮**
 * （需准备1个行动轮）
 * 造成3点雷元素伤害。
 */
const Wavestrider = createSkill(14054)
  .setType("elemental")
  .dealDamage(3, DamageType.Electro)
  .build();

/**
 * **捉浪·涛拥之守**
 * 本角色将在下次行动时，直接使用技能：踏潮。
 * 准备技能期间：提供2点护盾，保护所附属的角色。
 */
const TidecallerSurfEmbrace = createStatus(114051)
  .prepare(Wavestrider)
  .shield(2)
  .build();

/**
 * **捉浪**
 * 本角色附属捉浪·涛拥之守并准备技能：踏潮。
 */
const Tidecaller = createSkill(14052)
  .setType("elemental")
  .costElectro(3)
  .createCharacterStatus(TidecallerSurfEmbrace)
  .build();

/**
 * **雷兽之盾**
 * 我方角色普通攻击后：造成1点雷元素伤害。
 * 我方角色受到至少为3的伤害时：抵消其中1点伤害。
 * 持续回合：2
 */
const ThunderbeastsTarge = createStatus(114053)
  .withDuration(2)
  .on("useSkill", (c) => {
    if (c.info.type === "normal") {
      c.dealDamage(1, DamageType.Electro);
    }
  })
  .on("beforeDamaged", (c) => {
    if (c.value >= 3) {
      c.decreaseDamage(1);
    }
  })
  .build();

/**
 * **斫雷**
 * 造成2点雷元素伤害，生成雷兽之盾。
 */
const Stormbreaker = createSkill(14053)
  .setType("burst")
  .costElectro(3)
  .costEnergy(3)
  .dealDamage(3, DamageType.Electro)
  .createCombatStatus(ThunderbeastsTarge)
  .build();

export const Beidou = createCharacter(1405)
  .addTags("electro", "claymore", "liyue")
  .addSkills(Oceanborne, Tidecaller, Stormbreaker, Wavestrider)
  .build();

/**
 * **奔潮引电**
 * 本回合内，所附属的角色普通攻击少花费1个无色元素。
 * 可用次数：2
 */
const SummonerOfLightning = createStatus(114052)
  .withDuration(1)
  .withUsage(2)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.type === "normal") {
      c.deductCost(DiceType.Void);
    } else {
      return false;
    }
  })
  .build();

/**
 * **霹雳连霄**
 * 战斗行动：我方出战角色为北斗时，装备此牌。
 * 北斗装备此牌后，立刻使用一次捉浪。
 * 装备有此牌的北斗使用踏潮时：如果准备技能期间受到过伤害，则使北斗本回合内「普通攻击」少花费1个无色元素。（最多触发2次）
 * （牌组中包含北斗，才能加入牌组）
 */
export const LightningStorm = createCard(214051, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Beidou)
  .addCharacterFilter(Beidou)
  .costElectro(3)
  .useSkill(Tidecaller)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => {
    if (c.sourceSkill.info.id === Wavestrider) {
      const status = c.this.master.findStatus(TidecallerSurfEmbrace);
      const shield = status?.value;
      if (shield !== 2) {
        c.this.master.createStatus(SummonerOfLightning);
      }
    }
  })
  .build();
