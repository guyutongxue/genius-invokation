import { DiceType, createCard, createStatus } from '@gi-tcg';

/**
 * **饱腹**
 * 本回合无法食用更多「料理」
 */
const Satiated = createStatus(303300)
  .withDuration(1)
  .build();

function createFood(id: number) {
  return createCard(id, ["character"])
    .setType("event")
    .addTags("food")
    .filterMyTargets((c) => !c.findStatus(Satiated))
    .doAtLast((c) => {
      c.target[0].createStatus(Satiated);
    });
}

/**
 * **仙跳墙**
 * 本回合中，目标角色下一次「元素爆发」造成的伤害+3。
 * （每回合每个角色最多食用1次「料理」）
 */
const AdeptusTemptation = createFood(333002)
  .costVoid(2)
  .buildToStatus("target0")
  .withUsage(1)
  .withDuration(1)
  .on("beforeSkillDamage", (c) => {
    if (c.skillInfo.type === "burst") {
      c.addDamage(3);
    } else {
      return false;
    }
  })
  .build();

/**
 * **黄油蟹蟹**
 * 本回合中，所有我方角色下次受到的伤害-2。
 * （每回合每个角色最多食用1次「料理」）
 */
const ButterCrab = createCard(333012)
  .setType("event")
  .addTags("food")
  .addFilter((c) => {
    return c.queryCharacterAll("*").some(c => !c.findStatus(Satiated));
  })
  .costVoid(2)
  .do((c) => {
    for (const ch of c.queryCharacterAll("*")) {
      if (!ch.findStatus(Satiated)) {
        ch.createStatus(ButterCrabStatus);
        ch.createStatus(Satiated);
      }
    }
  })
  .build();

const ButterCrabStatus = createStatus(333012)
  .withUsage(1)
  .withDuration(1)
  .on("beforeDamaged", (c) => c.decreaseDamage(2))
  .build();

/**
 * **绝云锅巴**
 * 本回合中，目标角色下一次「普通攻击」造成的伤害+1。
 * （每回合每个角色最多食用1次「料理」）
 */
const JueyunGuoba = createFood(333001)
  .buildToStatus("target0")
  .withUsage(1)
  .withDuration(1)
  .on("beforeSkillDamage", (c) => {
    if (c.skillInfo.type === "normal") {
      c.addDamage(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **莲花酥**
 * 本回合中，目标角色下次受到的伤害-3。
 * （每回合中每个角色最多食用1次「料理」）
 */
const LotusFlowerCrisp = createFood(333003)
  .costSame(1)
  .buildToStatus("target0")
  .withUsage(1)
  .withDuration(1)
  .on("beforeDamaged", (c) => c.decreaseDamage(3))
  .build();

/**
 * **兽肉薄荷卷**
 * 目标角色在本回合结束前，之后三次「普通攻击」都少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
const MintyMeatRolls = createFood(333008)
  .costSame(1)
  .buildToStatus("target0")
  .withUsage(3)
  .withDuration(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.type === "normal") {
      c.deductCost(DiceType.Void);
    } else {
      return false;
    }
  })
  .build();

/**
 * **蒙德土豆饼**
 * 治疗目标角色2点。
 * （每回合每个角色最多食用1次「料理」）
 */
const MondstadtHashBrown = createFood(333006)
  .costSame(1)
  .do((c) => c.target[0].heal(2))
  .build();

/**
 * **烤蘑菇披萨**
 * 治疗目标角色1点，两回合内结束阶段再治疗此角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
const MushroomPizza = createFood(333007)
  .costSame(1)
  .do((c) => c.target[0].heal(1))
  .buildToStatus("target0", 303305)
  .withUsage(2)
  .on("endPhase", (c) => { c.getMaster().heal(1); })
  .build();

/**
 * **北地烟熏鸡**
 * 本回合中，目标角色下一次「普通攻击」少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
const NorthernSmokedChicken = createFood(333004)
  .buildToStatus("target0")
  .withUsage(1)
  .withDuration(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkillCtx?.info.type === "normal") {
      c.deductCost(DiceType.Void);
    } else {
      return false;
    }
  })
  .build();

/**
 * **刺身拼盘**
 * 目标角色在本回合结束前，「普通攻击」造成的伤害+1。
 * （每回合每个角色最多食用1次「料理」）
 */
const SashimiPlatter = createFood(333010)
  .costSame(1)
  .buildToStatus("target0")
  .withDuration(1)
  .on("beforeSkillDamage", (c) => {
    if (c.skillInfo.type === "normal") {
      c.addDamage(1);
    }
  })
  .build();

/**
 * **甜甜花酿鸡**
 * 治疗目标角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
const SweetMadame = createFood(333005)
  .do((c) => { c.target[0].heal(1); })
  .build();

/**
 * **唐杜尔烤鸡**
 * 本回合中，所有我方角色下一次「元素战技」造成的伤害+2。
 * （每回合每个角色最多食用1次「料理」）
 */
const TandooriRoastChicken = createCard(333011)
  .setType("event")
  .addTags("food")
  .addFilter((c) => {
    return c.queryCharacterAll("*").some(c => !c.findStatus(Satiated));
  })
  .costVoid(2)
  .do((c) => {
    for (const ch of c.queryCharacterAll(`:exclude(:has(${Satiated}))`)) {
      ch.createStatus(TandooriRoastChickenStatus);
      ch.createStatus(Satiated);
    }
  })
  .build();

const TandooriRoastChickenStatus = createStatus(333011)
  .withUsage(1)
  .withDuration(1)
  .on("beforeSkillDamage", (c) => {
    if (c.skillInfo.type === "elemental") {
      c.addDamage(2);
    } else {
      return false;
    }
  })
  .build();

const ReviveOnCoolDown = createStatus(303307)
  .withDuration(1)
  .build();

/**
 * **提瓦特煎蛋**
 * 复苏目标角色，并治疗此角色1点。
 * （每回合中，最多通过「料理」复苏1个角色，并且每个角色最多食用1次「料理」）
 */
const TeyvatFriedEgg = createCard(333009, ["character"])
  .setType("event")
  .addTags("food")
  .filterMyTargets((c) => !c.isAlive(), true)
  .addFilter((c) => !c.findCombatStatus(ReviveOnCoolDown))
  .costSame(3)
  .do((c) => {
    c.target[0].heal(1);
    c.createCombatStatus(ReviveOnCoolDown);
  })
  .build();
