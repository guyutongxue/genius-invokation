import { DiceType } from "@gi-tcg/typings";

export function flip(who: 0 | 1): 0 | 1 {
  return (1 - who) as 0 | 1;
}

/**
 * "智能"选骰算法
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @returns 可以选择的骰子序号（基于 `dice`）；如果无法选择则返回空数组
 */
export function chooseDice(required: DiceType[], dice: DiceType[]): number[] {
  const requiredMap = new Map<DiceType, number>();
  for (const r of required) {
    if (r === DiceType.Energy) continue;
    requiredMap.set(r, (requiredMap.get(r) ?? 0) + 1);
  }
  const OMNI_COUNT = dice.filter((d) => d === DiceType.Omni).length;
  if (requiredMap.has(DiceType.Omni)) {
    const requiredCount = requiredMap.get(DiceType.Omni)!;
    for (let i = dice.length - 1; i >= 0; i--) {
      if (dice[i] === DiceType.Omni) continue;
      const thisCount = dice.filter((d) => d === dice[i]).length;
      if (thisCount + OMNI_COUNT < requiredCount) continue;
      const result: number[] = [];
      for (
        let j = dice.length - 1;
        result.length < requiredCount && j >= 0;
        j--
      ) {
        if (dice[j] === DiceType.Omni || dice[j] === dice[i]) result.push(j);
      }
      return result;
    }
    return [];
  }
  const result: number[] = [];
  next: for (const r of required) {
    if (r === DiceType.Energy) continue;
    if (r === DiceType.Void) {
      for (let j = dice.length - 1; j >= 0; j--) {
        if (!result.includes(j)) {
          result.push(j);
          continue next;
        }
      }
    } else {
      for (let j = 0; j < dice.length; j++) {
        if (!result.includes(j) && dice[j] === r) {
          result.push(j);
          continue next;
        }
      }
      for (let j = 0; j < dice.length; j++) {
        if (!result.includes(j) && dice[j] === DiceType.Omni) {
          result.push(j);
          continue next;
        }
      }
    }
    return [];
  }
  return result;
}

/**
 * 检查骰子是否符合要求
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @param chosen 已选择的骰子
 * @returns 是否符合要求
 */
export function checkDice(required: readonly DiceType[], chosen: readonly DiceType[]): boolean {
  const requiredMap = new Map<DiceType, number>();
  for (const r of required) {
    if (r === DiceType.Energy) continue;
    requiredMap.set(r, (requiredMap.get(r) ?? 0) + 1);
  }
  if (requiredMap.has(DiceType.Omni)) {
    const requiredCount = requiredMap.get(DiceType.Omni)!;
    if (requiredCount !== chosen.length) return false;
    const chosenMap = new Set<DiceType>(chosen);
    return (
      chosenMap.size === 1 ||
      (chosenMap.size === 2 && chosenMap.has(DiceType.Omni))
    );
  }
  const chosen2 = [...chosen];
  let voidCount = 0;
  for (const r of required) {
    if (r === DiceType.Energy) continue;
    if (r === DiceType.Void) {
      voidCount++;
      continue;
    }
    const index = chosen2.indexOf(r);
    if (index === -1) {
      const omniIndex = chosen2.indexOf(DiceType.Omni);
      if (omniIndex === -1) return false;
      chosen2.splice(omniIndex, 1);
      continue;
    }
    chosen2.splice(index, 1);
  }
  return chosen2.length === voidCount;
}
