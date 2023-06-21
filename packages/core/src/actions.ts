import {
  SkillDescriptionContext,
  UseDiceContext,
  UseCardContext,
  CardWith,
} from "@jenshin-tcg/data";
import { ActionPhaseState } from "./states";
import { DiceType } from "@jenshin-tcg/typings";
import { flipByWho } from "./utils";
import { MAX_SUPPORTS } from "./config";

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
    action: (ctx: UseCardContext) => void;
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
    const curEnergy = this.state.characters[this.curPlayer][this.state.actives[this.curPlayer]].getEnergy();
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
      if (finalCost.filter(t => t === DiceType.ENERGY).length > curEnergy) {
        continue;
      }
      results.push({
        name: skill.name,
        cost: finalCost,
        action: (ctx2: SkillDescriptionContext) => {
          for (const handler of diceHandlers) {
            handler(ctx, true);
          }
          if (skill.type === "burst") {
            // TODO clear energy
          } else {
            ctx2.gainEnergy();
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
    const diceHandlers = this.getBeforeUseDiceHandlers();
    const curEnergy = this.state.characters[this.curPlayer][this.state.actives[this.curPlayer]].getEnergy();
    for (const card of cards) {

      // Handle dice deductions
      const deductedDice: DiceType[] = [];
      const ctx: UseDiceContext = {
        card: card.info,
        deductCost: (...args) => deductedDice.push(...args),
      }
      for (const handler of diceHandlers) {
        handler(ctx, false);
      }
      const finalCost = deductDice(card.cost, deductedDice);
      if (finalCost.filter(t => t === DiceType.ENERGY).length > curEnergy) {
        continue;
      }

      function wrapAction(action: (ctx: UseCardContext) => void) {
        return (ctx2: UseCardContext) => {
          for (const handler of diceHandlers) {
            handler(ctx, true);
          }
          action(ctx2);
        };
      }

      // Check "card with"es
      const wi = card.withInfo();
      if (typeof wi === "undefined") {
        const action = card.getAction();
        if (action) {
          result.push({
            id: card.objectId,
            cost: finalCost,
            removeSupport: this.state.summons[this.curPlayer].length === MAX_SUPPORTS,
            action: wrapAction(action),
          });
        }
      } else {
        const { type, who } = wi;
        let withes: (CardWith & { id: number })[];
        if (type === "character") {
          withes = this.state.characters[flipByWho(this.curPlayer, who)].map(c => ({
            type: "character",
            id: c.id,
            character: c.toContext(/* TODO! */),
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
          const action = card.getAction(cw);
          if (action) {
            filteredWithes.push({
              type: cw.type,
              id: cw.id,
              action: wrapAction(action),
            });
          }
        }
        if (filteredWithes.length === 0) continue;
        result.push({
          id: card.id,
          cost: finalCost,
          with: filteredWithes,
          removeSupport: this.state.summons[this.curPlayer].length === MAX_SUPPORTS,
        })
      }
    }
    return result;
  }
}
