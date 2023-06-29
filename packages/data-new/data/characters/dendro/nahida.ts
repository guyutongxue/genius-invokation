import { createCard, createCharacter, createSkill, createStatus, DamageType, Target } from "@gi-tcg";

/**
 * **行相**
 * 造成1点草元素伤害。
 */
const Akara = createSkill(17031)
  .setType("normal")
  .costDendro(1)
  .costVoid(2)
  .dealDamage(1, DamageType.Dendro)
  .build();

/**
 * **蕴种印**
 * 任意具有「蕴种印」的所在阵营角色受到元素反应伤害后：对所附属角色造成1点穿透伤害。
 * 可用次数：2
 */
const SeedOfSkadha = createStatus(117031)
  .withUsage(2)
  .listenToOthers()
  .on("damaged", (c) => {
    if (c.target.hasStatus(SeedOfSkadha) && c.reaction) {
      // 摩耶之殿天赋（火）：受到元素反应伤害的对象的伤害是草元素伤害
      if (c.allCharacters(true).some(c => c.hasEquipment(TheSeedOfStoredKnowledge))
        && c.allCharacters(true).filter(c => c.info.tags.includes("pyro")).length
        && c.target.entityId === c.getMaster().entityId) {
        c.dealDamage(1, DamageType.Dendro, c.target.asTarget());
      } else {
        c.dealDamage(1, DamageType.Piercing, c.getMaster().asTarget());
      }
    } else {
      return false;
    }
  })
  .build();

/**
 * **所闻遍计**
 * 造成2点草元素伤害，目标角色附属蕴种印；如果在附属前目标角色已附属有蕴种印，就改为对所有敌方角色附属蕴种印。
 */
const AllSchemesToKnow = createSkill(17032)
  .setType("elemental")
  .costDendro(3)
  .do((c) => {
    if (c.target.hasStatus(SeedOfSkadha)) {
      c.createStatus(SeedOfSkadha, Target.oppAll());
    } else {
      c.createStatus(SeedOfSkadha, Target.oppActive());
    }
  })
  .build();

/**
 * **所闻遍计·真如**
 * 造成3点草元素伤害，所有敌方角色附属蕴种印。
 */
const AllSchemesToKnowTathata = createSkill(17033)
  .setType("elemental")
  .costDendro(5)
  .createStatus(SeedOfSkadha, Target.oppAll())
  .build();


/**
 * **摩耶之殿**
 * 我方引发元素反应时：伤害额外+1。
 * 持续回合：2
 */
const ShrineOfMaya = createStatus(117032)
  .withDuration(2)
  .on("beforeDealDamage", (c) => {
    if (c.reaction) {
      c.addDamage(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **摩耶之殿**
 * 我方引发元素反应时：伤害额外+1。
 * 持续回合：3
 */
const ShrineOfMaya01 = createStatus(117032)
  .withDuration(3)
  .on("beforeDealDamage", (c) => {
    if (c.reaction) {
      c.addDamage(1);
    } else {
      return false;
    }
  })
  .build();

/**
 * **心景幻成**
 * 造成4点草元素伤害，生成摩耶之殿。
 */
const IllusoryHeart = createSkill(17034)
  .setType("burst")
  .costDendro(3)
  .costEnergy(2)
  .do((c) => {
    if (c.character.hasEquipment(TheSeedOfStoredKnowledge)) {
      // 摩耶之殿天赋（水）：持续回合+1
      if (c.allCharacters().filter(c => c.info.tags.includes("hydro")).length) {
        c.createStatus(ShrineOfMaya01);
      } else {
        c.createStatus(ShrineOfMaya);
      }
      // 摩耶之殿天赋（雷）：蕴种印可用次数+1
      if (c.allCharacters().filter(c => c.info.tags.includes("electro")).length) {
        c.allCharacters(true).forEach(ch => {
          const status = ch.hasStatus(SeedOfSkadha);
          status?.gainUsage(1);
        });
      }
    } else {
      c.createStatus(ShrineOfMaya);
    }
  })
  .build();

export const Nahida = createCharacter(1703)
  .addTags("dendro", "catalyst", "sumeru")
  .addSkills(Akara, AllSchemesToKnow, AllSchemesToKnowTathata, IllusoryHeart)
  .build();

/**
 * **心识蕴藏之种**
 * 战斗行动：我方出战角色为纳西妲时，装备此牌。
 * 纳西妲装备此牌后，立刻使用一次心景幻成。
 * 装备有此牌的纳西妲在场时，根据我方队伍中存在的元素类型提供效果：
 * 火元素：摩耶之殿在场时，自身受到元素反应触发蕴种印的敌方角色，所受蕴种印的穿透伤害改为草元素伤害；
 * 雷元素：摩耶之殿入场时，使当前对方场上蕴种印的可用次数+1；
 * 水元素：装备有此牌的纳西妲所生成的摩耶之殿初始持续回合+1。
 * （牌组中包含纳西妲，才能加入牌组）
 */
export const TheSeedOfStoredKnowledge = createCard(217031)
  .setType("equipment")
  .addTags("talent", "action")
  .requireCharacter(Nahida)
  .addActiveCharacterFilter(Nahida)
  .costDendro(3)
  .costEnergy(2)
  .useSkill(IllusoryHeart)
  .buildToEquipment()
  .build();
