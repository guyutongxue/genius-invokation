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
  protected character: ICharacter;
  constructor(c: CardWith) {
    if (c.type !== "character") throw new Error("Invalid card with");
    this.character = c.character;
  }
  static checkWith(c: CardWith): boolean {
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
    if (this.kinds.includes(c.info.type) && c.damage) {
      c.damage.addDamage(this.value);
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
  onBeforeDamaged(c: DamageContext) {
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
    // super.onUse(c);
    c.createStatus(Satiated, [], Target.ME | Target.ALL);
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
    if (c.skill && c.skill.type === "normal") {
      c.deductCost(DiceType.VOID);
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
    c.createStatus(MushroomPizzaStatus, [], this.character.toTarget());
  }
}
@Status({
  objectId: 333007,
  duration: 2,
})
class MushroomPizzaStatus implements IStatus {
  onEndPhase(c: Context) {
    c.heal(1);
  }
}

@FoodCard(333004)
class NorthernSmokedChicken extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.createStatus(NorthernSmokedChickenStatus, [], this.character.toTarget());
  }
}
@Status({
  objectId: 333008,
  usage: 1,
})
class NorthernSmokedChickenStatus implements IStatus {
  onBeforeUseDice(c: UseDiceContext) {
    if (c.skill && c.skill.type === "normal") {
      c.deductCost(DiceType.VOID);
      return true;
    }
  }
}

@FoodCard(333010)
@Same(1)
class SashimiPlatter extends FoodCardBase {
  onUse(c: Context) {
    super.onUse(c);
    c.createStatus(SashimiPlatterStatus, [], this.character.toTarget());
  }
}
@Status({
  objectId: 333010,
  duration: 1,
})
class SashimiPlatterStatus implements IStatus {
  onBeforeUseSkill(c: SkillContext) {
    if (c.info.type === "normal" && c.damage) {
      c.damage.addDamage(1);
      return true;
    }
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
    c.createStatus(TandooriRoastChickenStatus, [], this.character.toTarget());
  }
}
@ADStatus(333011)
class TandooriRoastChickenStatus extends AddDamageBase {
  constructor() {
    super(2, "skill");
  }
}

@FoodCard(333009)
@Same(3)
class TeyvatFriedEgg extends FoodCardBase {
  static checkWith(c: CardWith): boolean {
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

register(
  Satiated,
  AdeptusTemptation,
  AdeptusTemptationStatus,
  ButterCrab,
  ButterCrabStatus,
  JueyunGuoba,
  JueyunGuobaStatus,
  LotusFlowerCrisp,
  LotusFlowerCrispStatus,
  MintyMeatRolls,
  MintyMeatRollsStatus,
  MondstadtHashBrown,
  MushroomPizza,
  MushroomPizzaStatus,
  NorthernSmokedChicken,
  NorthernSmokedChickenStatus,
  SashimiPlatter,
  SashimiPlatterStatus,
  SweetMadame,
  TandooriRoastChicken,
  TandooriRoastChickenStatus,
  TeyvatFriedEgg
);
