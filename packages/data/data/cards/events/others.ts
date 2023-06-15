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
  Target,
} from "@jenshin-tcg";

@Card({
  objectId: 332005,
  type: "event",
})
class IHaventLostYet implements ICard {
  enabled = false;

  onDefeated(c: DamageContext) {
    if (Target.isMine(c.target.toTarget())) {
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
  objectId: 331801,
  type: "event"
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
      !Target.isMine(c.target.toTarget()) &&
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
