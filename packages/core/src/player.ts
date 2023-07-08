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
import { GameOptions, PlayerConfig } from "./game.js";
import { Character } from "./character.js";
import { Status } from "./status.js";
import { Support } from "./support.js";
import { Summon } from "./summon.js";
import { shallowClone } from "./entity.js";
import { Notifier } from "./state.js";
import { ContextOfEvent, EventHandlers, RollContext } from "@gi-tcg/data";
import { ContextFactory } from "./context.js";

interface PlayerConfigWithGame extends PlayerConfig {
  game: GameOptions
}

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
    private readonly config: PlayerConfigWithGame,
    private readonly notifier: Notifier
  ) {
    this.piles = config.deck.actions.map((id) => new Card(id));
    this.characters = config.deck.characters.map((id) => new Character(id));
    if (!config.noShuffle) {
      this.piles = _.shuffle(this.piles);
    }
  }

  initHands() {
    const legends = this.piles
      .map((c, i) => [c, i] as const)
      .filter(([c]) => c.isLegend())
      .map(([c, i]) => i);
    this.drawHands(this.config.game.initialHands, legends);
  }

  async drawHands(count: number, controlled: number[] = []) {
    const drawn: Card[] = [];
    for (const cardIdx of controlled) {
      drawn.push(...this.piles.splice(cardIdx, 1));
      if (drawn.length === count) {
        break;
      }
    }
    if (drawn.length < count) {
      drawn.push(...this.piles.splice(0, count - drawn.length));
    }
    this.hands.push(...drawn);
    // "爆牌"
    const discardedCount = this.hands.length - this.config.game.maxHands;
    this.hands.splice(this.config.game.maxHands, discardedCount);

    this.notifier.me({ type: "stateUpdated", damages: [] });
    this.notifier.opp({
      type: "oppChangeHands",
      removed: 0,
      added: this.hands.length,
      discarded: discardedCount,
    });
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
    this.drawHands(removed.length);
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
    };
    if (delayNotify) {
      return oppNotify;
    } else {
      oppNotify();
    }
  }

  async rollDice(times = 2) {}

  handleEvent<E extends keyof EventHandlers>(
    event: E,
    cf: ContextFactory<ContextOfEvent<E>>
  ) {
    const activeIndex = this.characters.findIndex(
      (c) => c.entityId === this.active
    );
    for (let i = 0; i < this.characters.length; i++) {
      const character =
        this.characters[(activeIndex + i) % this.characters.length];
      character.handleEvent(event, cf);
    }
    for (const status of this.combatStatuses) {
      status.handleEvent(event, cf);
    }
    for (const summon of this.summons) {
      summon.handleEvent(event, cf);
    }
    for (const support of this.supports) {
      support.handleEvent(event, cf);
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

class RollContextImpl implements RollContext {
  private rollCount = 2;
  constructor(readonly activeCharacterElement: DiceType) {}
  fixDice(...dice: DiceType[]): void {}
  addRerollCount(count: number): void {}
  roll() {}
}
