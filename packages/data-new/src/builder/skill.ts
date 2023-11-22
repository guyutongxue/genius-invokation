import { Mutation, applyMutation } from "../mutation";
import { registerSkill } from "../registry";
import { InSkillEventPayload, SkillDefinition } from "../skill";
import { GameState } from "../state";
import { SkillContext } from "./context";
import { SkillHandle } from "./type";

type SkillDescription = SkillDefinition["action"];
type SkillTriggerOn = SkillDefinition["triggerOn"];
type SkillOperation = (c: SkillContext) => void;

class SkillBuilder {
  private operations: SkillOperation[] = [];
  constructor(
    private id: number,
    private triggerOn: SkillTriggerOn,
  ) {}

  do(op: SkillOperation) {
    this.operations.push(op);
    return this;
  }

  build(): SkillHandle {
    const action: SkillDescription = (st: GameState, callerId: number) => {
      const ctx = new SkillContext(st, this.id, callerId);
      for (const op of this.operations) {
        op(ctx);
      }
      return [ctx.state, ctx.events] as const;
    };
    registerSkill({
      type: "skill",
      id: this.id,
      triggerOn: this.triggerOn,
      action,
    } as SkillDefinition);
    return this.id as SkillHandle;
  }
}

export function skill(id: number) {
  return new SkillBuilder(id, null);
}
