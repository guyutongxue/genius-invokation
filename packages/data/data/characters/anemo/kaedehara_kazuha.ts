import { Aura, DamageType, StatusHandle, createCard, createCharacter, createSkill, createStatus, createSummon } from "@gi-tcg";

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


function createMidareRanzan(id: number, type: DamageType) {
  return createStatus(id)
    .on("earlyBeforeDealDamage", (c) => {
      if (c.sourceSkill?.plunging && c.damageType === DamageType.Physical) {
        c.changeDamageType(type);
        c.addDamage(1);
      }
    })
    .on("useSkill", (c) => c.this.dispose())
    .build();
}

/**
 * **乱岚拨止·\***
 * 所附属角色进行下落攻击时，造成的物理伤害变为 \* 元素伤害，且伤害+1。
 * 角色使用技能后：移除此效果。
 */
const MidareRanzan = createMidareRanzan(115051, DamageType.Anemo);
const MidareRanzanCryo = createMidareRanzan(115053, DamageType.Cryo);
const MidareRanzanHydro = createMidareRanzan(115054, DamageType.Hydro);
const MidareRanzanPyro = createMidareRanzan(115055, DamageType.Pyro);
const MidareRanzanElectro = createMidareRanzan(115056, DamageType.Electro);

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
  .do((c) => {
    if (c.target.aura === Aura.Cryo || c.target.aura === Aura.CryoDendro) {
      c.character.createStatus(MidareRanzanCryo);
    } else if (c.target.aura === Aura.Hydro) {
      c.character.createStatus(MidareRanzanHydro);
    } else if (c.target.aura === Aura.Pyro) {
      c.character.createStatus(MidareRanzanPyro);
    } else if (c.target.aura === Aura.Electro) {
      c.character.createStatus(MidareRanzanElectro);
    } else {
      c.character.createStatus(MidareRanzan);
    }
  })
  .build()

const ChihayaburuPassive = createSkill(15054)
  .setType("passive")
  .on("useSkill",
    (c) => c.info.id === Chihayaburu,
    (c) => { c.switchActive(">") })
  .build();

/**
 * **流风秋野**
 * 结束阶段：造成一点风元素伤害。
 * 可用次数：3
 * 我方角色或召唤物引发扩散反应后：转换此牌的元素类型，改为造成被扩散的元素类型的伤害。（离场前仅限一次）
 */
const AutumnWhirlwind = createSummon(115052)
  .withUsage(3)
  .withThis({ dmgType: DamageType.Anemo })
  .on("endPhase", (c) => {
    c.dealDamage(1, c.this.dmgType);
  })
  .on("dealDamage", (c) => {
    if ((c.sourceSkill || c.sourceSummon) && c.this.dmgType === DamageType.Anemo) {
      const newType = c.reaction?.swirledElement() ?? null;
      if (newType !== null) {
        c.this.dmgType = newType;
      }
    }
    return false;
  })
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
  .addSkills(GaryuuBladework, Chihayaburu, KazuhaSlash, ChihayaburuPassive)
  .build()

/**
 * **风物之诗咏**
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
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(Chihayaburu) })
  .on("dealDamage", (c) => {
    const swirled = c.reaction?.swirledElement() ?? null;
    if (swirled === null) return;
    let status: StatusHandle;
    switch (swirled) {
      case DamageType.Cryo: status = PoeticsOfFuubutsuCryo; break;
      case DamageType.Hydro: status = PoeticsOfFuubutsuHydro; break;
      case DamageType.Pyro: status = PoeticsOfFuubutsuPyro; break;
      case DamageType.Electro: status = PoeticsOfFuubutsuElectro; break;
    }
    c.createCombatStatus(status);
  })
  .build()

function createPoeticsOfFuubutsu(id: number, type: DamageType) {
  return createStatus(id)
    .withUsage(2)
    .on("beforeDealDamage",
      (c) => !!c.sourceSkill && !!c.sourceSummon && !c.sourceReaction
        && c.damageType === type,
      (c) => c.addDamage(1))
    .build();
}

/**
 * **风物之诗咏·\***
 * 我方角色和召唤物所造成的 \* 元素伤害+1。
 * 可用次数：2
 */
const PoeticsOfFuubutsuCryo = createPoeticsOfFuubutsu(115057, DamageType.Cryo);
const PoeticsOfFuubutsuHydro = createPoeticsOfFuubutsu(115058, DamageType.Hydro);
const PoeticsOfFuubutsuPyro = createPoeticsOfFuubutsu(115059, DamageType.Pyro);
const PoeticsOfFuubutsuElectro = createPoeticsOfFuubutsu(115050, DamageType.Electro);
