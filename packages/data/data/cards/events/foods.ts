import {
  Card,
  CardWith,
  Context,
  DamageContext,
  DiceType,
  ICard,
  ICharacter,
  IStatus,
  Same,
  SkillContext,
  SkillType,
  Status,
  Target,
  UseCardContext,
  UseDiceContext,
  Void,
  register,
} from "@jenshin-tcg";

@Status({
  objectId: 303300,
  duration: 1,
})
class Satiated implements IStatus {}

class FoodCardBase implements ICard {
  constructor(protected character: ICharacter) {}
  static enabledWith(c: CardWith): boolean {
    return (
      c.type === "character" &&
      c.character.getHealth() !== 0 &&
      !c.character.hasStatus(Satiated)
    );
  }
  onUse(c: UseCardContext) {
    c.createStatus(Satiated, [], this.character.toTarget());
  }
}
function FoodCard(objectId: number) {
  return Card({
    objectId,
    type: "event",
    tags: ["food"],
    with: [
      {
        type: "character",
        who: 0,
      },
    ],
  });
}

class AddDamageBase implements IStatus {
  private kinds: SkillType[];
  constructor(private value: number, ...kinds: SkillType[]) {
    this.kinds = kinds;
  }
  onBeforeUseSkill(c: SkillContext) {
    if (this.kinds.includes(c.info.type)) {
      c.addDamage(this.value);
      return true;
    }
  }
}
function ADStatus(objectId: number) {
  return Status({
    objectId,
    usage: 1,
  });
}

class DecreaseDamageBase implements IStatus {
  constructor(private value: number) {}
  onDamage(c: DamageContext) {
    c.decreaseDamage(this.value);
    return true;
  }
}
function DDStatus(objectId: number) {
  return Status({
    objectId,
    usage: 1,
  });
}

@FoodCard(333002)
@Void(2)
class AdeptusTemptation extends FoodCardBase {
  onUse(c: UseCardContext) {
    super.onUse(c);
    c.createStatus(AdeptusTemptationStatus, [], this.character.toTarget());
  }
}
@ADStatus(333002)
class AdeptusTemptationStatus extends AddDamageBase {
  constructor() {
    super(3, "burst");
  }
}

@FoodCard(333012)
@Void(2)
class ButterCrab extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.createStatus(ButterCrabStatus, [], Target.ME | Target.ALL);
  }
}
@DDStatus(333012)
class ButterCrabStatus extends DecreaseDamageBase {
  constructor() {
    super(2);
  }
}

@FoodCard(333001)
class JueyunGuoba extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.createStatus(JueyunGuobaStatus, [], this.character.toTarget());
  }
}
@ADStatus(333001)
class JueyunGuobaStatus extends AddDamageBase {
  constructor() {
    super(1, "normal");
  }
}

@FoodCard(333003)
@Same(1)
class LotusFlowerCrisp extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.createStatus(LotusFlowerCrispStatus, [], this.character.toTarget());
  }
}
@DDStatus(333003)
class LotusFlowerCrispStatus extends DecreaseDamageBase {
  constructor() {
    super(3);
  }
}

@FoodCard(333008)
class MintyMeatRolls extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.createStatus(MintyMeatRollsStatus, [], this.character.toTarget());
  }
}
@Status({
  objectId: 333008,
  usage: 3,
  duration: 1,
})
class MintyMeatRollsStatus implements IStatus {
  onBeforeUseDice(c: UseDiceContext) {
    if (c.skill && c.skill.info.type === "normal") {
      c.deductCost(DiceType.VOID, 1);
      return true;
    }
  }
}

@FoodCard(333006)
class MondstadtHashBrown extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.heal(2, this.character.toTarget());
  }
}

@FoodCard(333007)
@Same(1)
class MushroomPizza extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.heal(1, this.character.toTarget());
    // 治疗目标角色1点，两回合内结束阶段再治疗此角色1点。
    // （每回合每个角色最多食用1次「料理」）
  }
}

@FoodCard(333004)
class NorthernSmokedChicken extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    // 本回合中，目标角色下一次「普通攻击」少花费1个无色元素。
    // （每回合每个角色最多食用1次「料理」）
  }
}


@FoodCard(333010)
@Same(1)
class SashimiPlatter extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    // 目标角色在本回合结束前，「普通攻击」造成的伤害+1。
    // （每回合每个角色最多食用1次「料理」）
  }
}

@FoodCard(333005)
class SweetMadame extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.heal(1, this.character.toTarget());
  }
}

@FoodCard(333011)
@Void(2)
class TandooriRoastChicken extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    // 本回合中，所有我方角色下一次「元素战技」造成的伤害+2。
    // （每回合每个角色最多食用1次「料理」）
  }
}

@FoodCard(333009)
@Same(3)
class TeyvatFriedEgg extends FoodCardBase {
  enabledWith(c: CardWith): boolean {
    return (
      c.type === "character" &&
      c.character.getHealth() === 0 &&
      !c.character.hasStatus(Satiated)
    );
  }
  onUse(c: Context) {
    super.onUse(c);
    c.heal(1, this.character.toTarget());
  }
}

register(Satiated, SweetMadame);
