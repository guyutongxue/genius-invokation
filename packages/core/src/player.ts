import { OppPlayerData } from "@gi-tcg/typings";
import { Card } from "./card.js";
import { PlayerConfig } from "./game.js";
import * as _ from "lodash-es";

export class Player {
  piles: Card[];
  characters: Character[];
  opp: Player;

  constructor(private readonly config: PlayerConfig) {
    this.piles = config.deck.actions.map(id => new Card(id));
    if (!config.noShuffle) {
      this.piles = _.shuffle(this.piles);
    }
  }

  getPlayerData(): PlayerData {

  }
  getPlayerDataForOpp(): OppPlayerData {
    
  }
}
