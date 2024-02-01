import { character, skill, summon, status, combatStatus, card, DamageType, Aura, isReactionSwirl } from "@gi-tcg/core/builder";

/**
 * @id 115052
 * @name 流风秋野
 * @description
 * 结束阶段：造成1点风元素伤害。
 * 可用次数：3
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 */
const AutumnWhirlwind = summon(115052)
  .endPhaseDamage("swirledAnemo", 1)
  .usage(3)
  .done();

/**
 * @id 115051
 * @name 乱岚拨止
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为风元素伤害，且伤害+1。
 * 角色使用技能后：移除此效果。
 */
const MidareRanzan = status(115051)
  .on("beforeSkillDamageType", (c) => c.player.canPlunging)
  .changeDamageType(DamageType.Anemo)
  .increaseDamage(1)
  .on("skill")
  .dispose()
  .done();

/**
 * @id 115053
 * @name 乱岚拨止·冰
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为冰元素伤害，且伤害+1。
 * 所附属角色使用技能后：移除此效果。
 */
const MidareRanzanCryo = status(115053)
  .on("beforeSkillDamageType", (c) => c.player.canPlunging)
  .changeDamageType(DamageType.Cryo)
  .increaseDamage(1)
  .on("skill")
  .dispose()
  .done();

/**
 * @id 115056
 * @name 乱岚拨止·雷
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为雷元素伤害，且伤害+1。
 * 所附属角色使用技能后：移除此效果。
 */
const MidareRanzanElectro = status(115056)
  .on("beforeSkillDamageType", (c) => c.player.canPlunging)
  .changeDamageType(DamageType.Electro)
  .increaseDamage(1)
  .on("skill")
  .dispose()
  .done();

/**
 * @id 115054
 * @name 乱岚拨止·水
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为水元素伤害，且伤害+1。
 * 所附属角色使用技能后：移除此效果。
 */
const MidareRanzanHydro = status(115054)
  .on("beforeSkillDamageType", (c) => c.player.canPlunging)
  .changeDamageType(DamageType.Hydro)
  .increaseDamage(1)
  .on("skill")
  .dispose()
  .done();

/**
 * @id 115055
 * @name 乱岚拨止·火
 * @description
 * 所附属角色进行下落攻击时：造成的物理伤害变为火元素伤害，且伤害+1。
 * 所附属角色使用技能后：移除此效果。
 */
const MidareRanzanPyro = status(115055)
  .on("beforeSkillDamageType", (c) => c.player.canPlunging)
  .changeDamageType(DamageType.Pyro)
  .increaseDamage(1)
  .on("skill")
  .dispose()
  .done();

/**
 * @id 115057
 * @name 风物之诗咏·冰
 * @description
 * 我方角色和召唤物所造成的冰元素伤害+1。
 * 可用次数：2
 */
const PoeticsOfFuubutsuCryo = combatStatus(115057)
  .on("beforeDealDamage", (c) => c.damageInfo.type === DamageType.Cryo)
  .usage(2)
  .increaseDamage(1)
  .done();

/**
 * @id 115050
 * @name 风物之诗咏·雷
 * @description
 * 我方角色和召唤物所造成的雷元素伤害+1。
 * 可用次数：2
 */
const PoeticsOfFuubutsuElectro = combatStatus(115050)
  .on("beforeDealDamage", (c) => c.damageInfo.type === DamageType.Electro)
  .usage(2)
  .increaseDamage(1)
  .done();

/**
 * @id 115058
 * @name 风物之诗咏·水
 * @description
 * 我方角色和召唤物所造成的水元素伤害+1。
 * 可用次数：2
 */
const PoeticsOfFuubutsuHydro = combatStatus(115058)
  .on("beforeDealDamage", (c) => c.damageInfo.type === DamageType.Hydro)
  .usage(2)
  .increaseDamage(1)
  .done();

/**
 * @id 115059
 * @name 风物之诗咏·火
 * @description
 * 我方角色和召唤物所造成的火元素伤害+1。
 * 可用次数：2
 */
const PoeticsOfFuubutsuPyro = combatStatus(115059)
  .on("beforeDealDamage", (c) => c.damageInfo.type === DamageType.Pyro)
  .usage(2)
  .increaseDamage(1)
  .done();

/**
 * @id 15051
 * @name 我流剑术
 * @description
 * 造成2点物理伤害。
 */
const GaryuuBladework = skill(15051)
  .type("normal")
  .costAnemo(1)
  .costVoid(2)
  .damage(DamageType.Physical, 2)
  .done();

/**
 * @id 15052
 * @name 千早振
 * @description
 * 造成3点风元素伤害，本角色附属乱岚拨止。
 * 如果此技能引发了扩散，则将乱岚拨止转换为被扩散的元素。
 * 此技能结算后：我方切换到后一个角色。
 */
const Chihayaburu = skill(15052)
  .type("elemental")
  .costAnemo(3)
  .do((c) => {
    const aura = c.$("opp active")!.aura;
    let midareRanzan;
    switch (aura) {
      case Aura.Cryo:
      case Aura.CryoDendro:
        midareRanzan = MidareRanzanCryo;
        break;
      case Aura.Electro:
        midareRanzan = MidareRanzanElectro;
        break;
      case Aura.Hydro:
        midareRanzan = MidareRanzanHydro;
        break;
      case Aura.Pyro:
        midareRanzan = MidareRanzanPyro;
        break;
      default:
        midareRanzan = MidareRanzan;
        break;
    }
    c.characterStatus(midareRanzan);
  })
  .done();

/**
 * @id 15053
 * @name 万叶之一刀
 * @description
 * 造成3点风元素伤害，召唤流风秋野。
 */
const KazuhaSlash = skill(15053)
  .type("burst")
  .costAnemo(3)
  .costEnergy(2)
  .damage(DamageType.Anemo, 3)
  .summon(AutumnWhirlwind)
  .done();

/**
 * @id 15054
 * @name 千早振
 * @description
 * 
 */
const ChihayaburuPassive = skill(15054)
  .type("passive")
  .on("skill", (c) => c.eventArg.definition.id === Chihayaburu)
  .switchActive("my next")
  .done();

/**
 * @id 1505
 * @name 枫原万叶
 * @description
 * 拾花鸟之一趣，照月风之长路。
 */
const KaedeharaKazuha = character(1505)
  .tags("anemo", "sword", "inazuma")
  .health(10)
  .energy(2)
  .skills(GaryuuBladework, Chihayaburu, KazuhaSlash, Chihayaburu)
  .done();

/**
 * @id 215051
 * @name 风物之诗咏
 * @description
 * 战斗行动：我方出战角色为枫原万叶时，装备此牌。
 * 枫原万叶装备此牌后，立刻使用一次千早振。
 * 装备有此牌的枫原万叶引发扩散反应后：使我方角色和召唤物接下来2次所造成的被扩散元素类型的伤害+1。（每种元素类型分别计算次数）
 * （牌组中包含枫原万叶，才能加入牌组）
 */
const PoeticsOfFuubutsu = card(215051)
  .costAnemo(3)
  .talent(KaedeharaKazuha)
  .on("dealDamage", (c) => isReactionSwirl(c.eventArg))
  .do((c) => {
    const swirled = isReactionSwirl(c.eventArg)!;
    switch (swirled) {
      case DamageType.Cryo:
        c.combatStatus(PoeticsOfFuubutsuCryo);
        break;
      case DamageType.Electro:
        c.combatStatus(PoeticsOfFuubutsuElectro);
        break;
      case DamageType.Hydro:
        c.combatStatus(PoeticsOfFuubutsuHydro);
        break;
      case DamageType.Pyro:
        c.combatStatus(PoeticsOfFuubutsuPyro);
        break;
    }
  })
  .done();
