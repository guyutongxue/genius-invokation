import { CharacterInfoWithId } from ".";
import { CharacterHandle } from "./builders";

type TargetInfo = {
  type: "byPos",
  pos: "active" | "standby" | "prev" | "next" | "all",
  opp: boolean
} | {
  type: "byId",
  id: number,
  opp: boolean
} | {
  type: "byEntityId",
  entityId: number
} | {
  type: "recentOpp",
  relativeTo: TargetInfo
} | {
  type: "oneEnergyNotFull",
};

export class Target {
  private constructor(private readonly info: TargetInfo) {}

  static ofCharacter(character: CharacterHandle | CharacterInfoWithId, opp = false) {
    let id: number;
    if (typeof character === "number") {
      id = character;
    } else {
      id = character.id;
    }
    return new Target({
      type: "byId",
      id,
      opp
    });
  }
  static oppActive() {
    return new Target({
      type: "byPos",
      pos: "active",
      opp: true
    });
  }
  static oppNext() {
    return new Target({
      type: "byPos",
      pos: "next",
      opp: true
    });
  }
  static oppPrev() {
    return new Target({
      type: "byPos",
      pos: "prev",
      opp: true
    });
  }
  static oppStandby() {
    return new Target({
      type: "byPos",
      pos: "standby",
      opp: true
    });
  }
  static oppAll() {
    return new Target({
      type: "byPos",
      pos: "all",
      opp: true
    });
  }
  static myActive() {
    return new Target({
      type: "byPos",
      pos: "active",
      opp: false
    });
  }
  static myNext() {
    return new Target({
      type: "byPos",
      pos: "next",
      opp: false
    });
  }
  static myPrev() {
    return new Target({
      type: "byPos",
      pos: "prev",
      opp: false
    });
  }
  static myStandby() {
    return new Target({
      type: "byPos",
      pos: "standby",
      opp: false
    });
  }
  static myAll() {
    return new Target({
      type: "byPos",
      pos: "all",
      opp: false
    });
  }
  static oppRecentFrom(target: Target) {
    return new Target({
      type: "recentOpp",
      relativeTo: target.info
    });
  }
  static oneEnergyNotFull() {
    return new Target({
      type: "oneEnergyNotFull"
    });
  }
}
