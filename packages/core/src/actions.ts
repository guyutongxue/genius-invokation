import { SkillDescriptionContext, UseDiceContext } from "@jenshin-tcg/data";
import { ActionPhaseState } from "./states";
import { DiceType } from "@jenshin-tcg/typings";

function deductDice(original: DiceType[], deducted: DiceType[]) {
  const result = [...original];
  for (const d of deducted) {
    const idx = result.indexOf(d);
    if (idx !== -1) {
      result.splice(idx, 1);
    }
  }
  return result;
}

interface SkillActionReq {
  name: string;
  cost: DiceType[];
  action: (ctx: SkillDescriptionContext) => void;
}

export class ActionScanner {
  private curPlayer;
  constructor(private state: ActionPhaseState) {
    this.curPlayer = state.turn;
  }

  private getBeforeUseDiceHandlers() {
    const statuses = this.activeCharacter.getStatuses();
    const combatStatuses = this.state.combatStatuses[this.curPlayer];
    const supports: never[] = []; // TODO
    return [...statuses, ...combatStatuses, ...supports].map(
      (i) => (ctx: UseDiceContext, deductUsage: boolean) =>
        i.handle("onBeforeUseDice", ctx, deductUsage)
    );
  }

  get activeCharacter() {
    const activeId = this.state.actives[this.curPlayer];
    return this.state.characters[this.curPlayer][activeId];
  }

  scanSkills(): SkillActionReq[] {
    const skills = this.activeCharacter.getSkills();
    const results: SkillActionReq[] = [];
    const diceHandlers = this.getBeforeUseDiceHandlers();
    for (const skill of skills) {
      const deductedDice: DiceType[] = [];
      const ctx: UseDiceContext = {
        skill,
        deductCost: (...args) => deductedDice.push(...args),
      };
      for (const handler of diceHandlers) {
        handler(ctx, false);
      }
      const finalCost = deductDice(skill.costs, deductedDice);
      results.push({
        name: skill.name,
        cost: finalCost,
        action: (ctx2: SkillDescriptionContext) => {
          for (const handler of diceHandlers) {
            handler(ctx, true);
          }
          skill.do(ctx2);
        },
      });
    }
    return results;
  }
}
