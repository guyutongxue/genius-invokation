import { DamageType, createCard, createCharacter, createSkill, createStatus, createSummon } from "@gi-tcg";

/**
 * **我流剑术**
 * 造成2点物理伤害。
 */
const GaryuuBladework = createSkill(15051)
  .setType("normal")
  .costAnemo(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build()

/**
 * 乱岚拨止
 * 所附属角色进行下落攻击时，造成的物理伤害变为风元素伤害，且伤害+1。
 * 角色使用技能后：移除此效果。
 */
const MidareRanzan = createStatus(-2)
  .on("earlyBeforeDealDamage", (c) => {
    if (c.sourceSkill?.isPlunging() && c.damageType === DamageType.Physical) {
      c.changeDamageType(DamageType.Anemo);
      c.addDamage(1);
    }
  })
  .on("useSkill", (c) => c.dispose())
  .build()

// TODO: MAYBE 5 status here? wait for next update data

/**
 * **千早振**
 * 造成3点风元素伤害，本角色附属乱岚拨止。
 * 如果此技能引发了扩散，则将乱岚拨止转换为被扩散的元素。
 * 此技能结算后：我方切换到后一个角色。
 */
const Chihayaburu = createSkill(15052)
  .setType("elemental")
  .costAnemo(3)
  .dealDamage(3, DamageType.Anemo)
  .createStatus(MidareRanzan)
  // TODO
  .build()

/**
 * **流风秋野**
 * 结束阶段：造成一点风元素伤害。
 * 可用次数：3
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 */
const AutumnWhirlwind = createSummon(-4)
  .withUsage(3)
  .do({
    onEndPhase(c) {
      c.dealDamage(1, this.type);
    },
    onDealDamage(c) {
      if ((c.sourceSkill || c.sourceSummon) && c.damageType !== DamageType.Anemo) {
        const newType = c.reaction?.swirledElement() ?? null;
        if (newType !== null) {
          this.type = newType;
        }
      }
      return false;
    }
  }, { type: DamageType.Anemo })
  .build();

/**
 * **万叶之一刀**
 * 造成3点风元素伤害，召唤流风秋野。
 */
const KazuhaSlash = createSkill(15053)
  .setType("burst")
  .costAnemo(3)
  .costEnergy(2)
  .dealDamage(3, DamageType.Anemo)
  .summon(AutumnWhirlwind)
  .build()

const KaedeharaKazuha = createCharacter(1505)
  .addTags("anemo", "sword", "inazuma")
  .maxEnergy(2)
  .addSkills(GaryuuBladework, Chihayaburu, KazuhaSlash)
  .build()

/**
 * 风物之诗咏
 * 战斗行动：我方出战角色为枫原万叶时，装备词牌。
 * 枫原万叶装备此牌后，立刻使用一次千早振。
 * 装备有此牌的枫原万叶引发扩散反应后：使我方角色和召唤物接下来2次所造成的被扩散元素类型的伤害+1。
 * （每种元素类型分别计算次数）
 * （牌组中包含枫原万叶，才能加入牌组）
 */
export const PoeticsOfFuubutsu = createCard(215051, ["character"])
  .addTags("action", "talent")
  .requireCharacter(KaedeharaKazuha)
  .addCharacterFilter(KaedeharaKazuha)
  .costAnemo(3)
  .useSkill(Chihayaburu)
  .buildToEquipment()
  // TODO
  .build()
