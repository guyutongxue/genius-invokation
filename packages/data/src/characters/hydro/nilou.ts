import { character, skill, summon, status, combatStatus, card, DamageType, DiceType } from "@gi-tcg/core/builder";

/**
 * @id 112082
 * @name 丰穰之核
 * @description
 * 结束阶段：造成2点草元素伤害。
 * 可用次数：1（可叠加，最多叠加到3次）
 * 我方宣布结束时：如果此牌的可用次数至少为2，则造成2点草元素伤害。（需消耗可用次数）
 */
export const BountifulCore = summon(112082)
  .hintIcon(DamageType.Dendro)
  .hintText("2")
  .on("endPhase")
  .usage(1, { recreateMax: 3 })
  .if((c) => c.$(`my equipment with definition id ${TheStarrySkiesTheirFlowersRain}`))
  .damage(DamageType.Dendro, 3)
  .else()
  .damage(DamageType.Dendro, 2)
  .on("declareEnd", (c) => c.getVariable("usage") >= 2)
  .if((c) => c.$(`my equipment with definition id ${TheStarrySkiesTheirFlowersRain}`))
  .damage(DamageType.Dendro, 3)
  .else()
  .damage(DamageType.Dendro, 2)
  .addVariable("usage", -1)
  .done();

/**
 * @id 112083
 * @name 永世流沔
 * @description
 * 结束阶段：对所附属角色造成3点水元素伤害。
 * 可用次数：1
 */
export const LingeringAeon = status(112083)
  .on("endPhase")
  .usage(1)
  .damage(DamageType.Hydro, 3, "@master")
  .done();

/**
 * @id 112081
 * @name 金杯的丰馈
 * @description
 * 敌方角色受到绽放反应时：我方不再生成草原核，而是改为召唤丰穰之核。
 */
export const GoldenChalicesBounty = combatStatus(112081)
  .on("reaction", (c, e) => !c.of(e.reactionInfo.target).isMine())
  .listenToAll()
  .summon(BountifulCore)
  .done(); // 不再生成草原核的部分由核心反应代码提供

/**
 * @id 12081
 * @name 弦月舞步
 * @description
 * 造成2点物理伤害。
 */
export const DanceOfSamser = skill(12081)
  .type("normal")
  .costHydro(1)
  .costVoid(2)
  .damage(DamageType.Physical, 2)
  .done();

/**
 * @id 12082
 * @name 七域舞步
 * @description
 * 造成3点水元素伤害，如果队伍中包含水元素角色和草元素角色且不包含其他元素的角色，就生成金杯的丰馈。
 */
export const DanceOfHaftkarsvar = skill(12082)
  .type("elemental")
  .costHydro(3)
  .damage(DamageType.Hydro, 3)
  .do((c) => {
    const elements = new Set(c.$$(`all my characters include defeated`).map((c) => c.element()));
    if (elements.size === 2 && elements.has(DiceType.Hydro) && elements.has(DiceType.Dendro)) {
      c.combatStatus(GoldenChalicesBounty);
    }
  })
  .done();

/**
 * @id 12083
 * @name 浮莲舞步·远梦聆泉
 * @description
 * 造成2点水元素伤害，目标角色附属永世流沔。
 */
export const DanceOfAbzendegiDistantDreamsListeningSpring = skill(12083)
  .type("burst")
  .costHydro(3)
  .costEnergy(2)
  .damage(DamageType.Hydro, 2)
  .characterStatus(LingeringAeon, "opp active")
  .done();

/**
 * @id 1208
 * @name 妮露
 * @description
 * 莲步轻舞，出尘醉梦。
 */
export const Nilou = character(1208)
  .tags("hydro", "sword", "sumeru")
  .health(10)
  .energy(2)
  .skills(DanceOfSamser, DanceOfHaftkarsvar, DanceOfAbzendegiDistantDreamsListeningSpring)
  .done();

/**
 * @id 212081
 * @name 星天的花雨
 * @description
 * 战斗行动：我方出战角色为妮露时，装备此牌。
 * 妮露装备此牌后，立刻使用一次七域舞步。
 * 装备有此牌的妮露在场时：我方丰穰之核造成的伤害+1。
 * （牌组中包含妮露，才能加入牌组）
 */
export const TheStarrySkiesTheirFlowersRain = card(212081)
  .costHydro(3)
  .talent(Nilou)
  .on("enter")
  .useSkill(DanceOfHaftkarsvar)
  .done();
