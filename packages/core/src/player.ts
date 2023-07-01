import {
  DiceType,
  Event,
  MyPlayerData,
  OppPlayerData,
  RpcMethod,
  RpcRequest,
  RpcResponse,
} from "@gi-tcg/typings";
import { verifyRpcRequest, verifyRpcResponse } from "@gi-tcg/typings";
import * as _ from "lodash-es";

import { Card } from "./card.js";
import { PlayerConfig } from "./game.js";
import { Character } from "./character.js";
import { Status } from "./status.js";
import { Support } from "./support.js";
import { Summon } from "./summon.js";
import { shallowClone } from "./entity.js";
import { Notifier } from "./state.js";

export class Player {
  piles: Card[];
  active: number | null = null;
  hands: Card[] = [];
  characters: Character[];
  combatStatuses: Status[] = [];
  supports: Support[] = [];
  summons: Summon[] = [];
  dice: DiceType[] = [];
  specialBits: number = 0;

  constructor(
    private readonly config: PlayerConfig,
    private readonly notifier: Notifier
  ) {
    this.piles = config.deck.actions.map((id) => new Card(id));
    this.characters = config.deck.characters.map((id) => new Character(id));
    if (!config.noShuffle) {
      this.piles = _.shuffle(this.piles);
    }
  }

  initHands(count: number) {
    for (let i = 0; i < this.piles.length; i++) {
      if (this.piles[i].isArcane()) {
        this.hands.push(this.piles[i]);
        this.piles.splice(i, 1);
        i--;
        if (this.hands.length === count) {
          break;
        }
      }
    }
    if (this.hands.length < count) {
      this.hands.push(...this.piles.splice(0, count - this.hands.length));
    }
  }

  async switchHands() {
    const { removedHands } = await this.rpc("switchHands", {});
    const removed: Card[] = [];
    for (let i = 0; i < this.hands.length; i++) {
      if (removedHands.includes(this.hands[i].entityId)) {
        removed.push(this.hands[i]);
        this.hands.splice(i, 1);
        i--;
      }
    }
    this.piles.push(...removed);
    if (!this.config.noShuffle) {
      this.piles = _.shuffle(this.piles);
    }
    this.notifier.opp({
      type: "oppChangeHands",
      removed: removed.length,
      added: 0,
      discarded: 0,
    });
  }

  async chooseActive(delayNotify: false): Promise<void>;
  async chooseActive(delayNotify: true): Promise<() => void>;
  async chooseActive(delayNotify = false): Promise<any> {
    const { active } = await this.rpc("chooseActive", {
      candidates: this.characters
        .filter((c) => {
          return c.isAlive() && c.entityId !== this.active;
        })
        .map((c) => c.entityId),
    });
    this.active = active;
    this.notifier.me({
      type: "switchActive",
      opp: false,
      target: active,
    });
    const oppNotify = () => {
      this.notifier.opp({
        type: "switchActive",
        opp: true,
        target: active,
      });
    }
    if (delayNotify) {
      return oppNotify;
    } else {
      oppNotify();
    }
  }

  private async rpc<M extends RpcMethod>(
    method: M,
    data: RpcRequest[M]
  ): Promise<RpcResponse[M]> {
    verifyRpcRequest(method, data);
    const resp = await this.config.handler(method, data);
    verifyRpcResponse(method, resp);
    return resp;
  }

  private getDataBase() {
    return {
      pileNumber: this.piles.length,
      active: this.active,
      characters: this.characters.map((c) => c.getData()),
      combatStatuses: this.combatStatuses.map((s) => s.getData()),
      supports: this.supports.map((s) => s.getData()),
      summons: this.summons.map((s) => s.getData()),
    };
  }
  getData(): MyPlayerData {
    return {
      type: "my",
      hands: this.hands.map((c) => c.getData()),
      dice: [...this.dice],
      ...this.getDataBase(),
    };
  }
  getDataForOpp(): OppPlayerData {
    return {
      type: "opp",
      hands: this.hands.length,
      dice: this.dice.length,
      ...this.getDataBase(),
    };
  }

  clone() {
    const clone = shallowClone(this);
    // Card is not stateful, no need to deep clone (FOR NOW)
    // clone.piles = this.piles.map(c => c.clone());
    // clone.hands = this.hands.map(c => c.clone());
    clone.characters = this.characters.map((c) => c.clone());
    clone.combatStatuses = this.combatStatuses.map((s) => s.clone());
    clone.supports = this.supports.map((s) => s.clone());
    clone.summons = this.summons.map((s) => s.clone());
    return clone;
  }
}
