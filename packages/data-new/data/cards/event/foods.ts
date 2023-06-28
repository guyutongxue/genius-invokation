import { createCard } from '@gi-tcg';

/**
 * **仙跳墙**
 * 本回合中，目标角色下一次「元素爆发」造成的伤害+3。
 * （每回合每个角色最多食用1次「料理」）
 */
export const AdeptusTemptation = createCard(333002)
  .setType("event")
  .addTags("food")
  .costVoid(2)
  // TODO
  .build();

/**
 * **黄油蟹蟹**
 * 本回合中，所有我方角色下次受到的伤害-2。
 * （每回合每个角色最多食用1次「料理」）
 */
export const ButterCrab = createCard(333012)
  .setType("event")
  .addTags("food")
  .costVoid(2)
  // TODO
  .build();

/**
 * **绝云锅巴**
 * 本回合中，目标角色下一次「普通攻击」造成的伤害+1。
 * （每回合每个角色最多食用1次「料理」）
 */
export const JueyunGuoba = createCard(333001)
  .setType("event")
  .addTags("food")
  // TODO
  .build();

/**
 * **莲花酥**
 * 本回合中，目标角色下次受到的伤害-3。
 * （每回合中每个角色最多食用1次「料理」）
 */
export const LotusFlowerCrisp = createCard(333003)
  .setType("event")
  .addTags("food")
  .costSame(1)
  // TODO
  .build();

/**
 * **兽肉薄荷卷**
 * 目标角色在本回合结束前，之后三次「普通攻击」都少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
export const MintyMeatRolls = createCard(333008)
  .setType("event")
  .addTags("food")
  .costSame(1)
  // TODO
  .build();

/**
 * **蒙德土豆饼**
 * 治疗目标角色2点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const MondstadtHashBrown = createCard(333006)
  .setType("event")
  .addTags("food")
  .costSame(1)
  // TODO
  .build();

/**
 * **烤蘑菇披萨**
 * 治疗目标角色1点，两回合内结束阶段再治疗此角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const MushroomPizza = createCard(333007)
  .setType("event")
  .addTags("food")
  .costSame(1)
  // TODO
  .build();

/**
 * **北地烟熏鸡**
 * 本回合中，目标角色下一次「普通攻击」少花费1个无色元素。
 * （每回合每个角色最多食用1次「料理」）
 */
export const NorthernSmokedChicken = createCard(333004)
  .setType("event")
  .addTags("food")
  // TODO
  .build();

/**
 * **刺身拼盘**
 * 目标角色在本回合结束前，「普通攻击」造成的伤害+1。
 * （每回合每个角色最多食用1次「料理」）
 */
export const SashimiPlatter = createCard(333010)
  .setType("event")
  .addTags("food")
  .costSame(1)
  // TODO
  .build();

/**
 * **甜甜花酿鸡**
 * 治疗目标角色1点。
 * （每回合每个角色最多食用1次「料理」）
 */
export const SweetMadame = createCard(333005)
  .setType("event")
  .addTags("food")
  // TODO
  .build();

/**
 * **唐杜尔烤鸡**
 * 本回合中，所有我方角色下一次「元素战技」造成的伤害+2。
 * （每回合每个角色最多食用1次「料理」）
 */
export const TandooriRoastChicken = createCard(333011)
  .setType("event")
  .addTags("food")
  .costVoid(2)
  // TODO
  .build();

/**
 * **提瓦特煎蛋**
 * 复苏目标角色，并治疗此角色1点。
 * （每回合中，最多通过「料理」复苏1个角色，并且每个角色最多食用1次「料理」）
 */
export const TeyvatFriedEgg = createCard(333009)
  .setType("event")
  .addTags("food")
  .costSame(3)
  // TODO
  .build();
