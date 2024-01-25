import type { DiceType } from "@gi-tcg/typings";

export function flip(who: 0 | 1): 0 | 1 {
  return (1 - who) as 0 | 1;
}

const VOID = 0;
const OMNI = 8;
const ENERGY = 9;

/**
 * "智能"选骰算法（不检查能量）
 * @param required 卡牌或技能需要的骰子类型
 * @param dice 当前持有的骰子
 * @returns 布尔数组，被选择的骰子的下标对应元素设置为 `true`；如果无法选择则返回全 `false`。
 */
export function chooseDice(
  required: readonly DiceType[],
  dice: readonly DiceType[],
): boolean[] {
  const requiredMap = diceToMap(required, true);
  const OMNI_COUNT = dice.filter((d) => d === OMNI).length;
  const FAIL_RESULT = Array<boolean>(dice.length).fill(false);
  const result = [...FAIL_RESULT];
  // 需要同色骰子
  if (requiredMap.has(OMNI)) {
    const requiredCount = requiredMap.get(OMNI)!;
    // 杂色骰子+万能骰子，凑够同色
    for (let i = dice.length - 1; i >= 0; i--) {
      if (dice[i] === OMNI) continue;
      const thisCount = dice.filter((d) => d === dice[i]).length;
      if (thisCount + OMNI_COUNT < requiredCount) continue;
      for (
        let j = dice.length - 1, count = 0;
        count < requiredCount && j >= 0;
        j--
      ) {
        if (dice[j] === OMNI || dice[j] === dice[i]) {
          result[j] = true;
          count++;
        }
      }
      return result;
    }
    // ……或者只用万能骰子凑
    if (OMNI_COUNT >= requiredCount) {
      for (let i = dice.length - 1, count = 0; count < requiredCount; i--) {
        if (dice[i] === OMNI) {
          result[i] = true;
          count++;
        }
      }
      return result;
    }
    return FAIL_RESULT;
  }
  // 无色或者杂色
  next: for (const r of required) {
    if (r === ENERGY) continue;
    if (r === VOID) {
      // 无色：任何骰子都可以
      for (let j = dice.length - 1; j >= 0; j--) {
        if (!result[j]) {
          result[j] = true;
          continue next;
        }
      }
    } else {
      // 对应颜色或者万能骰子
      for (let j = 0; j < dice.length; j++) {
        if (!result[j] && dice[j] === r) {
          result[j] = true;
          continue next;
        }
      }
      for (let j = 0; j < dice.length; j++) {
        if (!result[j] && dice[j] === OMNI) {
          result[j] = true;
          continue next;
        }
      }
    }
    return FAIL_RESULT;
  }
  return result;
}

/**
 * 将骰子需求列表改写为 `Map<DiceType, number>` 形式
 * @param dice 骰子需求列表
 * @param allowEmpty 允许返回空 Map；默认不需要骰子时返回 `{(Omni, 0)}`
 * @returns 
 */
export function diceToMap(dice: readonly DiceType[], allowEmpty = false): Map<DiceType, number> {
  const result = new Map<DiceType, number>();
  for (const d of dice) {
    result.set(d, (result.get(d) ?? 0) + 1);
  }
  if (!allowEmpty && dice.length === 0) {
    result.set(OMNI, 0);
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
export function checkDice(
  required: readonly DiceType[],
  chosen: readonly DiceType[],
): boolean {
  const requiredMap = diceToMap(required, true);
  // 如果需要同色骰子
  if (requiredMap.has(OMNI)) {
    const requiredCount = requiredMap.get(OMNI)!;
    // 检查个数
    if (requiredCount !== chosen.length) return false;
    const chosenMap = new Set<DiceType>(chosen);
    // 完全同色，或者只有杂色+万能两种骰子
    return (
      chosenMap.size === 1 ||
      (chosenMap.size === 2 && chosenMap.has(OMNI))
    );
  }
  // 否则逐个检查杂色/无色
  const chosen2 = [...chosen];
  let voidCount = 0;
  for (const r of required) {
    if (r === ENERGY) continue;
    // 记录无色的个数，最后检查剩余个数是否一致
    if (r === VOID) {
      voidCount++;
      continue;
    }
    // 杂色：找到一个删一个
    const index = chosen2.indexOf(r);
    if (index === -1) {
      const omniIndex = chosen2.indexOf(OMNI);
      if (omniIndex === -1) return false;
      chosen2.splice(omniIndex, 1);
      continue;
    }
    chosen2.splice(index, 1);
  }
  return chosen2.length === voidCount;
}
