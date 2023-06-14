import {
  DiceType,
  register,
  IStatus,
  Context,
  DamageContext,
  Card,
  Omni,
  Status,
  ICard,
} from "@jenshin-tcg";

@Card({
  objectId: 110,
})
class IHaventLostYet implements ICard {
  enabled = false;

  onDamage(c: DamageContext) {
    if (c.isMyCharacter(c.target)) {
      this.enabled = true;
    }
  }

  onActionPhase(c: Context) {
    this.enabled = false;
  }

  onUse(c: Context) {
    c.generateDice(DiceType.OMNI);
    c.gainEnergy(1);
  }
}

@Card({
  objectId: 111,
})
@Omni(1)
class WindAndFreedom implements ICard {
  onUse(c: Context) {
    c.createCombatStatus(WindAndFreedomStatus);
  }
}

@Status({
  objectId: 123456,
  usage: 1,
  duration: 1,
})
class WindAndFreedomStatus implements IStatus {
  onDefeated(c: DamageContext) {
    if (
      !c.isMyCharacter(c.target) &&
      c.currentPhase === "action" &&
      c.isMyTurn()
    ) {
      c.flipNextTurn();
      return true;
    }
    return false;
  }
}

register(IHaventLostYet, WindAndFreedom, WindAndFreedomStatus);
