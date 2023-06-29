import { DiceType, Target, createCard, createStatus } from '@gi-tcg';

/**
 * **饱腹**
 * 本回合无法食用更多「料理」
 */
const Satiated = createStatus(303300).build();

function createFood(id: number) {
  return createCard(id, ["character"])
    .setType("event")
    .addTags("food")
    .filterTargets((c) => !c.hasStatus(Satiated))
    .do(function (c) {
      c.createStatus(Satiated, this[0].asTarget());
    });
}

/**
 * **仙跳墙**
 * 本回合中，目标角色下一次「元素爆发」造成的伤害+3。
 * （每回合每个角色最多食用1次「料理」）
 */
const AdeptusTemptation = createFood(333002)
  .costVoid(2)
  .buildToStatus("this0")
  .withUsage(1)
  .withDuration(1)
  .on("beforeUseSkill", (c) => {
    if (c.info.type === "burst") {
      c.damage?.addDamage(3);
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
const ButterCrab = createCard(333012, ["character"])
  .setType("event")
  .addTags("food")
  .filterTargets((c) => !c.hasStatus(Satiated))
  .costVoid(2)
  .do((c) => {
    c.createStatus(Satiated, Target.myAll());
  })
  .buildToStatus(Target.myAll())
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
  .buildToStatus("this0")
  .withUsage(1)
  .withDuration(1)
  .on("beforeUseSkill", (c) => {
    if (c.info.type === "normal") {
      c.damage?.addDamage(1);
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
  .buildToStatus("this0")
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
  .buildToStatus("this0")
  .withUsage(3)
  .withDuration(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkill?.type === "normal") {
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
  .do(function (c) {
    c.heal(2, this[0].asTarget());
  })
  .build();

/**
 * **烤蘑菇披萨**
 * 治疗目标角色1点，两回合内结束阶段再治疗此角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
const MushroomPizza = createFood(333007)
  .costSame(1)
  .do(function (c) {
    c.heal(1, this[0].asTarget());
  })
  .buildToStatus("this0")
  .withUsage(1)
  .withDuration(1)
  .on("endPhase", function (c) { c.getMaster().heal(1); })
  .build();

/**
 * **北地烟熏鸡**
 * 本回合中，目标角色下一次「普通攻击」少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
const NorthernSmokedChicken = createFood(333004)
  .buildToStatus("this0")
  .withUsage(1)
  .withDuration(1)
  .on("beforeUseDice", (c) => {
    if (c.useSkill?.type === "normal") {
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
  .buildToStatus("this0")
  .withDuration(1)
  .on("beforeUseSkill", (c) => {
    if (c.info.type === "normal") {
      c.damage?.addDamage(1);
    }
  })
  .build();

/**
 * **甜甜花酿鸡**
 * 治疗目标角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
const SweetMadame = createFood(333005)
  .do(function (c) {
    c.heal(1, this[0].asTarget());
  })
  .build();

/**
 * **唐杜尔烤鸡**
 * 本回合中，所有我方角色下一次「元素战技」造成的伤害+2。
 * （每回合每个角色最多食用1次「料理」）
 */
const TandooriRoastChicken = createFood(333011)
  .costVoid(2)
  .buildToStatus("this0")
  .withUsage(1)
  .withDuration(1)
  .on("beforeUseSkill", (c) => {
    if (c.info.type === "elemental") {
      c.damage?.addDamage(2);
    } else {
      return false;
    }
  })
  .build();

/**
 * **提瓦特煎蛋**
 * 复苏目标角色，并治疗此角色1点。
 * （每回合中，最多通过「料理」复苏1个角色，并且每个角色最多食用1次「料理」）
 */
const TeyvatFriedEgg = createCard(333009, ["character"])
  .setType("event")
  .addTags("food")
  .filterTargets((c) => c.health === 0)
  .costSame(3)
  .do(function (c) {
    c.heal(1, this[0].asTarget());
    c.createStatus(Satiated, this[0].asTarget());
  })
  .build();
