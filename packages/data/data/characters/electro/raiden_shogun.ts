import { createCard, createCharacter, createSkill, createStatus, createSummon, DamageType } from "@gi-tcg";

/**
 * **源流**
 * 造成2点物理伤害。
 */
const Origin = createSkill(14071)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **雷罚恶曜之眼**
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：3
 * 此召唤物在场时：我方角色「元素爆发」造成的伤害+1。
 */
const EyeOfStormyJudgement = createSummon(114071)
  .withUsage(3)
  .on("endPhase", (c) => c.dealDamage(1, DamageType.Electro))
  .on("beforeSkillDamage",
    (c) => c.sourceSkill.info.type === "burst",
    (c) => c.addDamage(1))
  .build();

/**
 * **神变·恶曜开眼**
 * 召唤雷罚恶曜之眼。
 */
const TranscendenceBalefulOmen = createSkill(14072)
  .setType("elemental")
  .costElectro(3)
  .summon(EyeOfStormyJudgement)
  .build();

/**
 * **奥义·梦想真说**
 * 造成3点雷元素伤害，其他我方角色获得2点充能。
 */
const SecretArtMusouShinsetsu = createSkill(14073)
  .setType("burst")
  .costElectro(4)
  .costEnergy(2)
  .dealDamage(3, DamageType.Electro)
  .do((c) => c.queryCharacterAll("<>").forEach((ch) => ch.gainEnergy(2)))
  .build();


/**
 * **诸愿百眼之轮**
 * 其他我方角色使用「元素爆发」后：累积1点「愿力」。（最多累积3点）
 * 所附属角色使用奥义·梦想真说时：消耗所有「愿力」，每点「愿力」使造成的伤害+1。
 */
const ChakraDesiderataStatus = createStatus(114072)
  .listenToOther()
  .withThis({ resolve: 0 })
  .on("beforeSkillDamage", (c) => {
    if (c.sourceSkill.info.id === SecretArtMusouShinsetsu) {
      c.addDamage(c.this.resolve);
    }
  })
  .on("useSkill", (c) => {
    // 清空愿力
    if (c.info.id === SecretArtMusouShinsetsu) {
      c.this.resolve = 0;
    } else if (c.info.type === "burst") {
      c.this.resolve = Math.min(3, c.this.resolve + 1);
    }
  })
  .build();


/**
 * **诸愿百眼之轮**
 * 【被动】战斗开始时，初始附属诸愿百眼之轮。
 */
const ChakraDesiderata = createSkill(14074)
  .setType("passive")
  .on("battleBegin", (c) => { c.this.character.createStatus(ChakraDesiderataStatus); })
  .on("revive", (c) => { c.this.character.createStatus(ChakraDesiderataStatus); })
  .build();

export const RaidenShogun = createCharacter(1407)
  .addTags("electro", "pole", "inazuma")
  .maxEnergy(2)
  .addSkills(Origin, TranscendenceBalefulOmen, SecretArtMusouShinsetsu, ChakraDesiderata)
  .build();

/**
 * **万千的愿望**
 * 战斗行动：我方出战角色为雷电将军时，装备此牌。
 * 雷电将军装备此牌后，立刻使用一次奥义·梦想真说。
 * 装备有此牌的雷电将军使用奥义·梦想真说时每消耗1点「愿力」，都使造成的伤害额外+1。
 * （牌组中包含雷电将军，才能加入牌组）
 */
export const WishesUnnumbered = createCard(214071, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(RaidenShogun)
  .addCharacterFilter(RaidenShogun)
  .costElectro(4)
  .costEnergy(2)
  .useSkill(SecretArtMusouShinsetsu)
  .buildToEquipment()
  .on("beforeSkillDamage", (c) => {
    const status = c.this.master.findStatus(ChakraDesiderataStatus);
    if (status && c.sourceSkill.id === SecretArtMusouShinsetsu) {
      c.addDamage(status.value);
    }
  })
  .build();
