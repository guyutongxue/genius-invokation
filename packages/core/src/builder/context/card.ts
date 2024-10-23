import { CardState } from "../../base/state";
import { getEntityById } from "../../utils";
import { ContextMetaBase, SkillContext } from "./skill";

export class Card<Meta extends ContextMetaBase> {
  constructor(private readonly skillContext: SkillContext<Meta>, public readonly id: number) {}
  get state(): CardState {
    return getEntityById(this.skillContext.state, this.id) as CardState;
  }
}
