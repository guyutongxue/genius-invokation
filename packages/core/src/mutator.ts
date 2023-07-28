import { PlayerIO } from "./io.js";
import { PlayerMutator } from "./player.js";
import { Store } from "./store.js";

export class Mutator {
  readonly players: readonly [PlayerMutator, PlayerMutator];

  constructor(
    private store: Store,
    private playerIO: readonly [PlayerIO | null, PlayerIO | null]
  ) {
    this.players = [
      new PlayerMutator(store, 0, playerIO[0]),
      new PlayerMutator(store, 1, playerIO[1]),
    ];
  }

}
