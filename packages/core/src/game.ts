import {
  Event,
  NotificationMessage,
  PhaseType,
  StateData,
  verifyNotificationMessage,
} from "@gi-tcg/typings";

import { GameOptions, PlayerConfig } from "./game_interface.js";
import { flip } from "@gi-tcg/utils";
import { GameState, Store, getData } from "./store.js";
import { Draft } from "immer";

export class Game {
  private store: Store;

  constructor(
    private readonly options: GameOptions,
    private readonly playerConfigs: [PlayerConfig, PlayerConfig],
  ) {
    this.store = Store.initialState(options, playerConfigs);
    this.start();
  }

  private get state() {
    return this.store.state;
  }
  private get mutator() {
    return this.store.mutator;
  }

  private produce(fn: (draft: Draft<GameState>) => void) {
    this.store._produce(fn);
  }

  private async start() {
    while (this.state.phase !== "gameEnd") {
      await this.step();
    }
    this.notifyPlayer(0, {
      type: "gameEnd",
      win: this.state.winner === null ? undefined : this.state.winner === 0,
    });
    this.notifyPlayer(1, {
      type: "gameEnd",
      win: this.state.winner === null ? undefined : this.state.winner === 1,
    });
  }

  private async step() {
    this.notifyPlayer(0, {
      type: "newGamePhase",
      roundNumber: this.state.roundNumber,
      isFirst: this.state.currentTurn === 0,
    });
    this.notifyPlayer(1, {
      type: "newGamePhase",
      roundNumber: this.state.roundNumber,
      isFirst: this.state.currentTurn === 1,
    });
    let nextPhase: PhaseType;
    switch (this.state.phase) {
      case "initHands":
        nextPhase = await this.initHands();
        break;
      case "initActives":
        nextPhase = await this.initActives();
        break;
      case "roll":
        nextPhase = await this.rollPhase();
        break;
      case "action":
        nextPhase = await this.actionPhase();
        break;
      case "end":
        nextPhase = await this.endPhase();
        break;
      case "gameEnd":
        return;
    }
    this.produce((draft) => {
      draft.phase = nextPhase;
    });
    await this.options.pauser();
  }
  private async initHands(): Promise<PhaseType> {
    this.mutator.players[0].initHands();
    this.mutator.players[1].initHands();
    await Promise.all([
      this.mutator.players[0].switchHands(),
      this.mutator.players[1].switchHands(),
    ]);
    return "initActives";
  }
  private async initActives(): Promise<PhaseType> {
    const [n0, n1] = await Promise.all([
      this.mutator.players[0].chooseActive(true),
      this.mutator.players[1].chooseActive(true),
    ]);
    n0();
    n1();
    this.store.mutator.emitEvent("onBattleBegin");
    await this.mutator.doEvent();
    return "roll";
  }
  private async rollPhase(): Promise<PhaseType> {
    await Promise.all([
      this.mutator.players[0].rollPhase(),
      this.mutator.players[1].rollPhase(),
    ]);
    return "action";
  }
  private async actionPhase(): Promise<PhaseType> {
    this.store.mutator.emitEvent("onActionPhase");
    await this.mutator.doEvent();
    if (this.store.state.phase === "gameEnd") {
      return "gameEnd";
    }
    while (
      !(this.state.players[0].declaredEnd && this.state.players[1].declaredEnd)
    ) {
      let thisTurn = this.state.currentTurn;
      if (this.state.players[thisTurn].declaredEnd) {
        thisTurn = flip(thisTurn);
      } else if (this.state.players[thisTurn].skipNextTurn) {
        this.produce((draft) => {
          draft.players[thisTurn].skipNextTurn = false;
        });
        thisTurn = flip(thisTurn);
      }
      const player = this.mutator.players[thisTurn];
      const fast = await player.action();
      await this.mutator.doEvent();
      if (<string>this.store.state.phase === "gameEnd") {
        return "gameEnd";
      }
      await this.options.pauser();
      if (!fast) {
        this.produce((draft) => {
          draft.currentTurn = flip(draft.currentTurn);
        });
      }
    }
    return "end";
  }
  private async endPhase(): Promise<PhaseType> {
    this.store.mutator.emitEvent("onEndPhase");
    await this.mutator.doEvent();
    if (this.store.state.phase === "gameEnd") {
      return "gameEnd";
    }
    await Promise.all([
      this.mutator.players[0].drawHands(2),
      this.mutator.players[1].drawHands(2),
    ]);
    this.produce((draft) => {
      draft.roundNumber++;
    });
    if (this.state.roundNumber > this.options.maxRounds) {
      return "gameEnd";
    } else {
      return "roll";
    }
  }

  private notifyPlayer(who: 0 | 1, event: Event) {
    const msg: NotificationMessage = {
      event,
      state: getData(this.state, who),
    };
    verifyNotificationMessage(msg);
    this.playerConfigs[who].onNotify?.(msg);
  }

  giveUp(who: 0 | 1) {
    this.store.mutator.gameEnd(flip(who));
  }
  preview(who: 0 | 1, skillId: number): StateData {
    throw new Error("Not implemented");
  }
}
