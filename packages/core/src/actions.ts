import {
  SkillDescriptionContext,
  UseDiceContext,
  UseCardContext,
  CardWith,
} from "@jenshin-tcg/data";
import { ActionPhaseState } from "./states";
import { DiceType } from "@jenshin-tcg/typings";
import { flipByWho } from "./utils";

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

interface CardActionReq {
  id: number;
  cost: DiceType[];
  with?: {
    type: "character" | "summon" | "support";
    id: number;
    action?: (ctx: UseCardContext) => void;
  }[];
  removeSupport: boolean;
  action?: (ctx: UseCardContext) => void;
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

  scanCards(): CardActionReq[] {
    const cards = this.state.hands[this.curPlayer];
    const result: CardActionReq[] = [];
    for (const c of cards) {
      // TODO DICE HANDLER HERE!
      const wi = c.withInfo();
      if (typeof wi === "undefined") {
        const action = c.getAction();
        if (action) {
          result.push({
            id: c.objectId,
            cost: c.cost,
            removeSupport: false, // TODO
            action,
          });
        }
      } else {
        const { type, who } = wi;
        let withes: (CardWith & { id: number })[];
        if (type === "character") {
          withes = this.state.characters[flipByWho(this.curPlayer, who)].map(c => ({
            type: "character",
            id: c.id,
            character: c.toICharacter(/* TODO! */),
          }));
        } else if (type === "summon") {
          withes = this.state.summons[flipByWho(this.curPlayer, who)].map(c => ({
            type: "summon",
            id: c.id,
            summon: c,
          }));
        } else /* if (type === "support") */ {
          throw new Error("Not implemented");
        }
        const filteredWithes = [];
        for (const cw of withes) {
          const action = c.getAction(cw);
          if (action) {
            filteredWithes.push({
              type: cw.type,
              id: cw.id,
              action,
            });
          }
        }
        result.push({
          id: c.id,
          cost: c.cost,
          with: filteredWithes,
          removeSupport: false, // TODO
        })
      }
    }
    return result;
  }
}
