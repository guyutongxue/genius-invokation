import { Mutation, applyMutation } from "../mutation";
import { GameState } from "../state";

class SkillBuilder {

  constructor(private _state: GameState) {
  }

  get state() {
    return this._state;
  }

  private mutate(...mutations: Mutation[]) {
    for (const m of mutations) {
      this._state = applyMutation(this._state, m);
    }
  }
}
