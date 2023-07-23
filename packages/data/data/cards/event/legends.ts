import { createCard, DiceType, SpecialBits } from "@gi-tcg";

/**
 * **旧时庭园**
 * 我方有角色已装备「武器」或「圣遗物」时，才能打出：
 * 本回合中，我方下次打出「武器」或「圣遗物」装备牌时少花费2个元素骰。
 * （整局游戏只能打出一张「秘传」卡牌：这张牌一定在你的起始手牌中）
 */
const AncientCourtyard = createCard(330001)
  .setType("event")
  .addTags("legend")
  .addFilter((c) => !c.checkSpecialBit(SpecialBits.LegendUsed))
  .addFilter((c) => {
    return c.queryCharacterAll("*").filter(ch =>
      ch.findEquipment("weapon") ||
      ch.findEquipment("artifact")).length > 0;
  })
  .buildToStatus("combat")
  .withUsage(1)
  .on("beforeUseDice", (c) => {
    if (c.playCardCtx?.isWeapon() ||
      c.playCardCtx?.info.tags.includes("artifact")) {
      c.deductCost(2);
    }
  })
  .build();


/**
 * **磐岩盟契**
 * 我方剩余元素骰数量为0时，才能打出：
 * 生成2个不同的基础元素骰。
 * （整局游戏只能打出一张「秘传」卡牌：这张牌一定在你的起始手牌中）
 */
const CovenantOfRock = createCard(330002)
  .setType("event")
  .addTags("legend")
  .addFilter((c) => !c.checkSpecialBit(SpecialBits.LegendUsed))
  .addFilter((c) => c.getDice().length === 0)
  .do((c) => {
    c.generateRandomElementDice(2);
  })
  .build();
