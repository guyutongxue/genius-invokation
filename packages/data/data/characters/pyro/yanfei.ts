import { DamageType, DiceType, createCard, createCharacter, createSkill, createStatus } from "@gi-tcg";

/**
 * **火漆制印**
 * 造成1点火元素伤害。
 */
const SealOfApproval = createSkill(-21)
  .setType("normal")
  .costPyro(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Pyro)
  .build()

/**
 * **丹火印**
 * 角色进行重击时，造成的伤害+2。
 * 可用次数：1
 */
const ScarletSeal = createStatus(-22)
  .withUsage(1)
  .on("beforeUseSkill", (c) => {
    if (c.isCharged()) {
      c.damage?.addDamage(2)
    } else {
      return false;
    }
  })
  .build()

/**
 * **丹书立约**
 * 造成3点火元素伤害，本角色附属丹火印。
 */
const SignedEdict = createSkill(-23)
  .setType("elemental")
  .costPyro(3)
  .dealDamage(3, DamageType.Pyro)
  .createStatus(ScarletSeal)
  .build()

/**
 * **灼灼**
 * 角色进行重击时，少花费一个火元素。（每回合1次）
 * 结束阶段：角色附属丹火印。
 * 持续回合：2
 */
const Brilliance = createStatus(-24)
  .withDuration(2)
  .do({
    onBeforeUseDice(c) {
      if (this.deductCount && c.useSkillCtx?.isCharged()) {
        c.deductCost(DiceType.Pyro);
        this.deductCount--;
      }
      return false;
    },
    onEndPhase(c) {
      c.createStatus(ScarletSeal);
    },
    onActionPhase(c) {
      this.deductCount = 1;
      return false;
    }
  }, { deductCount: 1 })
  .build()

/**
 * **凭此结契**
 * 造成3点火元素伤害，本角色附属丹火印和灼灼。
 */
const DoneDeal = createSkill(-25)
  .setType("burst")
  .costPyro(3)
  .costEnergy(2)
  .dealDamage(3, DamageType.Pyro)
  .createStatus(ScarletSeal)
  .createStatus(Brilliance)
  .build()

const YanFei = createCharacter(-20)
  .addTags("pyro", "catalyst", "liyue")
  .addSkills(SealOfApproval, SignedEdict, DoneDeal)
  .build()

/**
 * **最终解释权**
 * 我方出战角色为烟绯时，装备此牌。
 * 烟绯装备此牌后，立刻使用一次火漆制印。
 * 装备有此牌的烟绯进行重击时：对生命值不多于6的敌人造成的伤害+1。
 * （牌组中包含烟绯，才能加入牌组）
 */
const RightOfFinalInterpretation = createCard(-26, ["character"])
  .addTags("action", "talent")
  .requireCharacter(YanFei)
  .addCharacterFilter(YanFei)
  .useSkill(SealOfApproval)
  .buildToEquipment()
  // TODO
  .build()
