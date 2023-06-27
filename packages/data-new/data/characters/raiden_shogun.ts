import { createCharacter, createSkill, createStatus, createSummon, DamageType, Target } from "@gi-tcg";

/**
 * 源流
 * 造成2点物理伤害。
 */
const Origin = createSkill(14071)
  .setType("normal")
  .costElectro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * 雷罚恶曜之眼
 * 结束阶段：造成1点雷元素伤害。
 * 可用次数：3
 * 此召唤物在场时：我方角色「元素爆发」造成的伤害+1。
 */
const EyeOfStormyJudgement = createSummon(114071)
  .withUsage(3)
  .on("endPhase", (c) => c.dealDamage(1, DamageType.Electro))
  .on("beforeUseSkill", (c) => {
    if (c.info.type === "burst" && c.damage) {
      c.damage.addDamage(1);
    }
    return false;
  })
  .build();

/**
 * 神变·恶曜开眼
 * 召唤雷罚恶曜之眼。
 */
const TranscendenceBalefulOmen = createSkill(14072)
  .setType("elemental")
  .costElectro(3)
  .summon(EyeOfStormyJudgement)
  .build();

/**
 * 奥义·梦想真说
 * 造成3点雷元素伤害，其他我方角色获得2点充能。
 */
const SecretArtMusouShinsetsu = createSkill(10473)
  .setType("burst")
  .costElectro(4)
  .costEnergy(3)
  .dealDamage(3, DamageType.Electro)
  .gainEnergy(2, Target.myStandby())
  .build();

/**
 * 诸愿百眼之轮
 * 【被动】战斗开始时，初始附属诸愿百眼之轮。
 */
const ChakraDesiderata = createSkill(14074)
  .setType("passive")
  .onBattleBegin((c) => {
    c.createStatus(ChakraDesiderataStatus);
  })
  .build();

/**
 * 诸愿百眼之轮
 * 其他我方角色使用「元素爆发」后：累积1点「愿力」。（最多累积3点）
 * 所附属角色使用奥义·梦想真说时：消耗所有「愿力」，每点「愿力」使造成的伤害+1。
 */
const ChakraDesiderataStatus = createStatus(114072)
  .listenToOthers()
  .do(
    {
      onBeforeUseSkill(c) {
        if (c.info.type !== "burst") return;
        if (c.character.info.id === 1) {
          c.damage && c.damage.addDamage(this.resolve);
          this.resolve = 0;
        } else {
          this.resolve = Math.min(3, this.resolve + 1);
        }
      },
    },
    {
      resolve: 0,
    }
  )
  .build();

export const RaidenShogun = createCharacter(1407)
  .addTags("electro", "inazuma", "pole")
  .addSkills(Origin, TranscendenceBalefulOmen, SecretArtMusouShinsetsu)
  .build();
