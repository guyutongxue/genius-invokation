import { DiceType, card, status } from "@gi-tcg/core/builder";

/**
 * @id 311401
 * @name 白缨枪
 * @description
 * 角色造成的伤害+1。
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
export const WhiteTassel = card(311401)
  .costSame(2)
  .weapon("pole")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .done();

/**
 * @id 301101
 * @name 千岩之护
 * 根据「璃月」角色的数量提供护盾，保护所附属的角色。
 */
export const LithicGuard = status(301101)
  .shield(0)
  .done();

/**
 * @id 311402
 * @name 千岩长枪
 * @description
 * 角色造成的伤害+1。
 * 入场时：我方队伍中每有一名「璃月」角色，此牌就为附属的角色提供1点护盾。（最多3点）
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
export const LithicSpear = card(311402)
  .costSame(3)
  .weapon("pole")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("enter")
  .do((c) => {
    const liyueCount = c.$$(`my characters include defeated with tag (liyue)`).length;
    if (liyueCount > 0) {
      c.characterStatus(LithicGuard, "@master");
      const st = c.$(`status with definition id ${LithicGuard} at @master`)!;
      st.setVariable("shield", Math.min(liyueCount, 3));
    }
  })
  .done();

/**
 * @id 311403
 * @name 天空之脊
 * @description
 * 角色造成的伤害+1。
 * 每回合1次：角色使用「普通攻击」造成的伤害额外+1。
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
export const SkywardSpine = card(311403)
  .costSame(3)
  .weapon("pole")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("modifySkillDamage", (c, e) => e.isSourceSkillType("normal"))
  .usagePerRound(1)
  .increaseDamage(1)
  .done();

/**
 * @id 311404
 * @name 贯虹之槊
 * @description
 * 角色造成的伤害+1。
 * 角色如果在护盾角色状态或护盾出战状态的保护下，则造成的伤害额外+1。
 * 角色使用「元素战技」后：如果我方存在提供「护盾」的出战状态，则为一个此类出战状态补充1点「护盾」。（每回合1次）
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
export const VortexVanquisher = card(311404)
  .costSame(3)
  .weapon("pole")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("modifySkillDamage", (c, e) => {
    return !!c.$("(my combat statuses with tag (shield)) or status with tag (shield) at @master");
  })
  .increaseDamage(1)
  .on("useSkill")
  .usagePerRound(1)
  .do((c) => {
    const shieldCombatStatus = c.$("my combat status with tag (shield)");
    if (shieldCombatStatus) {
      shieldCombatStatus.addVariable("shield", 1)
    }
  })
  .done();

/**
 * @id 311405
 * @name 薙草之稻光
 * @description
 * 角色造成的伤害+1。
 * 每回合自动触发1次：如果所附属角色没有充能，就使其获得1点充能。
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
export const EngulfingLightning = card(311405)
  .costSame(3)
  .weapon("pole")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("enter", (c) => c.self.master().energy === 0)
  .gainEnergy(1, "@master")
  .on("actionPhase", (c) => c.self.master().energy === 0)
  .gainEnergy(1, "@master")
  .done();

/**
 * @id 301104
 * @name 贯月矢（生效中）
 * @description
 * 角色在本回合中，下次使用「元素战技」或装备「天赋」时：少花费2个元素骰。
 */
export const MoonpiercerStatus = status(301104)
  .oneDuration()
  .once("deductDice", (c, e) => e.isSkillOrTalentOf(c.self.master().state))
  .deductCost(DiceType.Omni, 2)
  .done();

/**
 * @id 311406
 * @name 贯月矢
 * @description
 * 角色造成的伤害+1。
 * 入场时：所附属角色在本回合中，下次使用「元素战技」或装备「天赋」时少花费2个元素骰。
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
export const Moonpiercer = card(311406)
  .costSame(3)
  .weapon("pole")
  .on("modifySkillDamage")
  .increaseDamage(1)
  .on("enter")
  .characterStatus(MoonpiercerStatus, "@master")
  .done();

/**
 * @id 311407
 * @name 和璞鸢
 * @description
 * 角色造成的伤害+1。
 * 角色使用技能后：直到回合结束前，此牌所提供的伤害加成值额外+1。（最多累积到+2）
 * （「长柄武器」角色才能装备。角色最多装备1件「武器」）
 */
export const PrimordialJadeWingedspear = card(311407)
  .costSame(3)
  .weapon("pole")
  .variable("extraDamage", 1)
  .on("actionPhase")
  .setVariable("extraDamage", 0)
  .on("modifySkillDamage")
  .do((c, e) => {
    e.increaseDamage(c.getVariable("extraDamage"));
  })
  .on("useSkill")
  .do((c, e) => {
    if (c.getVariable("extraDamage") < 3) {
      c.addVariable("extraDamage", 1);
    }
  })
  .done();
