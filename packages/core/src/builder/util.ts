import { UseDiceModifier } from "../base/skill";

export function canSwitchFast(m: UseDiceModifier) {
  return m.currentAction.type === "switchActive" && !m.currentFast;
}

export function canSwitchDeductCost1(m: UseDiceModifier) {
  return m.currentAction.type === "switchActive" && m.currentCost.length >= 1;
}
