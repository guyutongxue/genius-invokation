import { UseDiceContext } from "@jenshin-tcg/data";
import { ActionPhaseState } from "./states";

class ActionScanner {
  constructor(private state: ActionPhaseState) {}
  private curPlayer = this.state.turn;

  private getBeforeUseDiceHandlers() {
    const statuses = this.activeCharacter.getStatuses();
    const combatStatuses = this.state.combatStatuses[this.curPlayer];
    const supports: never[] = []; // TODO
    return [...statuses, ...combatStatuses, ...supports].map(
      (i) => (ctx: UseDiceContext) => i.handle("onBeforeUseDice", ctx)
    );
  }

  get activeCharacter() {
    const activeId = this.state.actives[this.curPlayer];
    return this.state.characters[this.curPlayer][activeId];
  }

  getSkills() {
    const skills = this.activeCharacter.getSkills();
    const diceHandlers = this.getBeforeUseDiceHandlers();
    for (const skill of skills) {
      // initial diceContext
      // apply every handler
      // read diceContext deduct effect
      // get final costs
      // push to result
    }
  }
}
