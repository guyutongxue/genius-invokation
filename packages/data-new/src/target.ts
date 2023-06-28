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
}

export class Target {
  private constructor(private readonly info: TargetInfo) {}

  static ofCharacter(character: CharacterHandle, opp = false) {
    return new Target({
      type: "byId",
      id: character,
      opp
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
}
