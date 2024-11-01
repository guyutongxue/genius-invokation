import { GameState } from "@gi-tcg/core";

class IoController {
  constructor(private controller: TestController, private who: 0 | 1) {}
}

export class TestController {
  public readonly me = new IoController(this, 0);
  public readonly opp = new IoController(this, 1);
  
  constructor(initState: GameState) {}

}
