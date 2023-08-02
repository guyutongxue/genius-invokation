import { createCard, createCharacter, createSkill, createStatus, DamageType } from "@gi-tcg";

/**
 * **菌王舞步**
 * 造成2点物理伤害。
 */
const MajesticDance = createSkill(27011)
  .setType("normal")
  .costDendro(1)
  .costVoid(2)
  .dealDamage(2, DamageType.Physical)
  .build();

/**
 * **不稳定孢子云**
 * 造成3点草元素伤害。
 */
const VolatileSporeCloud = createSkill(27012)
  .setType("elemental")
  .costDendro(3)
  .dealDamage(3, DamageType.Dendro)
  .build();

/**
 * **尾羽豪放**
 * 造成4点草元素伤害，消耗所有活化激能层数，每层使此伤害+1。
 */
const FeatherSpreading = createSkill(27013)
  .setType("burst")
  .costDendro(3)
  .costEnergy(2)
  .do((c) => {
    const vitality = c.character.findStatus(RadicalVitalityStatus)?.value ?? 0;
    c.dealDamage(4 + vitality, DamageType.Dendro);
  })
  .build();

/**
 * **活化激能**
 * 本角色造成或受到元素伤害后：累积1层「活化激能」。（最多累积3层）\n结束阶段：如果「活化激能」层数已达到上限，就将其清空。同时，角色失去所有充能。
 */
const RadicalVitalityStatus = createStatus(127013)
  .withThis({ vitality: 0 })
  .on("damaged",
    (c) => c.damageType !== DamageType.Physical && c.damageType !== DamageType.Piercing,
    (c) => {
      const MAX = c.this.master!.findEquipment(ProliferatingSpores) ? 4 : 3;
      c.this.vitality = Math.min(MAX, c.this.vitality + 1);
    })
  .on("dealDamage", (c) => {
    const MAX = c.this.master!.findEquipment(ProliferatingSpores) ? 4 : 3;
    c.this.vitality = Math.min(MAX, c.this.vitality + 1);
  })
  .on("endPhase", (c) => {
    const ch = c.this.master!;
    const MAX = ch.findEquipment(ProliferatingSpores) ? 4 : 3;
    if (c.this.vitality >= MAX) {
      c.this.vitality = 0;
      ch.loseEnergy(ch.energy);
    }
  })
  .build();


/**
 * **活化激能**
 * 【被动】战斗开始时，初始附属活化激能。
 */
const RadicalVitality = createSkill(27014)
  .setType("passive")
  .on("battleBegin", (c) => { c.this.master.createStatus(RadicalVitalityStatus); })
  .on("revive", (c) => { c.this.master.createStatus(RadicalVitalityStatus); })
  .build();

export const JadeplumeTerrorshroom = createCharacter(2701)
  .addTags("dendro", "monster")
  .addSkills(MajesticDance, VolatileSporeCloud, FeatherSpreading, RadicalVitality)
  .build();

/**
 * **孢子增殖**
 * 战斗行动：我方出战角色为翠翎恐蕈时，装备此牌。
 * 翠翎恐蕈装备此牌后，立刻使用一次不稳定孢子云。
 * 装备有此牌的翠翎恐蕈，可累积的「活化激能」层数+1。
 * （牌组中包含翠翎恐蕈，才能加入牌组）
 */
export const ProliferatingSpores = createCard(227011, ["character"])
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(JadeplumeTerrorshroom)
  .addCharacterFilter(JadeplumeTerrorshroom)
  .costDendro(3)
  .buildToEquipment()
  .on("enter", (c) => { c.useSkill(VolatileSporeCloud); })
  .build();
