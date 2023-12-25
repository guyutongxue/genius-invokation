import { DiceType } from "@gi-tcg/typings";

export function flip(who: 0 | 1): 0 | 1 {
  return (1 - who) as 0 | 1;
}

/**
 * "智能"选骰算法（不检查能量）
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @returns 可以选择的骰子序号（基于 `dice`）；如果无法选择则返回空数组
 */
export function chooseDice(required: readonly DiceType[], dice: readonly DiceType[]): number[] {
  const requiredMap = diceToMap(required);
  const OMNI_COUNT = dice.filter((d) => d === DiceType.Omni).length;
  // 需要同色骰子
  if (requiredMap.has(DiceType.Omni)) {
    const requiredCount = requiredMap.get(DiceType.Omni)!;
    // 杂色骰子+万能骰子，凑够同色
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
    // ……或者只用万能骰子凑
    if (OMNI_COUNT >= requiredCount) {
      const result: number[] = [];
      for (let i = dice.length - 1; result.length < requiredCount; i--) {
        if (dice[i] === DiceType.Omni) result.push(i);
      }
      return result;
    }
    return [];
  }
  const result: number[] = [];
  // 无色或者杂色
  next: for (const r of required) {
    if (r === DiceType.Energy) continue;
    if (r === DiceType.Void) {
      // 无色：任何骰子都可以
      for (let j = dice.length - 1; j >= 0; j--) {
        if (!result.includes(j)) {
          result.push(j);
          continue next;
        }
      }
    } else {
      // 对应颜色或者万能骰子
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

export function diceToMap(dice: readonly DiceType[]): Map<DiceType, number> {
  const result = new Map<DiceType, number>();
  for (const d of dice) {
    result.set(d, (result.get(d) ?? 0) + 1);
  }
  return result;
}

/**
 * 检查骰子是否符合要求（不检查能量）
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @param chosen 已选择的骰子
 * @returns 是否符合要求
 */
export function checkDice(required: readonly DiceType[], chosen: readonly DiceType[]): boolean {
  const requiredMap = diceToMap(required);
  // 如果需要同色骰子
  if (requiredMap.has(DiceType.Omni)) {
    const requiredCount = requiredMap.get(DiceType.Omni)!;
    // 检查个数
    if (requiredCount !== chosen.length) return false;
    const chosenMap = new Set<DiceType>(chosen);
    // 完全同色，或者只有杂色+万能两种骰子
    return (
      chosenMap.size === 1 ||
      (chosenMap.size === 2 && chosenMap.has(DiceType.Omni))
    );
  }
  // 否则逐个检查杂色/无色
  const chosen2 = [...chosen];
  let voidCount = 0;
  for (const r of required) {
    if (r === DiceType.Energy) continue;
    // 记录无色的个数，最后检查剩余个数是否一致
    if (r === DiceType.Void) {
      voidCount++;
      continue;
    }
    // 杂色：找到一个删一个
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
