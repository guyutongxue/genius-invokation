import { DamageModifier0, DamageModifier1, SkillType, UseDiceModifier } from "../base/skill";

/**
 * 检查该实体是否可以执行“切换角色行动视为快速行动”
 * 
 * 若当前行动不是切换角色，或者切换角色已经是快速行动时，返回 `false`。
 * @param c `"onBeforeUseDice"` 的 `SkillContext`
 * @returns 
 */
export function canSwitchFast(c: UseDiceModifier) {
  return c.currentAction.type === "switchActive" && !c.currentFast;
}

/**
 * 检查该实体是否可以执行“切换角色行动减少1元素骰”
 * 
 * 若当前行动不是切换角色，或者切换角色已经不消耗骰子时，返回 `false`。
 * @param c `"onBeforeUseDice"` 的 `SkillContext`
 * @returns 
 */
export function canSwitchDeductCost1(c: UseDiceModifier) {
  return c.currentAction.type === "switchActive" && c.currentCost.length >= 1;
}

/**
 * 检查正在修改伤害的来源技能是否为普通攻击、元素战技或元素爆发
 * @param c `"onSkillDamage"` 的 `SkillContext`
 * @returns
 */
export function checkDamageSkillType(c: DamageModifier0 | DamageModifier1, skillType: SkillType) {
  return c.damageInfo.via.definition.skillType === skillType;
}
