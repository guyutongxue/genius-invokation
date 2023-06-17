import { GameOptions, Player } from ".";
import {
  Event,
  CharacterFacade,
  DiceType,
  StateFacade,
  StatusFacade,
  SummonFacade,
  SupportFacade,
  MethodNames,
  ResponseType,
  RequestType,
  verifyRequest,
  verifyResponse,
} from "@jenshin-tcg/typings";
import { initCharacter, initPiles, randomDice, flip } from "./utils";
import * as _ from "lodash-es";
import { Character } from "./character";
import { INITIAL_HANDS, MAX_HANDS, MAX_ROUNDS } from "./config";
import { Card } from "./card";
import { Status } from "./status";
import { ActionScanner } from "./actions";
import { Context } from "@jenshin-tcg/data";

export type Pair<T> = [T, T];

export interface CoinTossState {
  type: "coinToss";
}

export interface WithPlayersState {
  players: Pair<any>;
  piles: Pair<Card[]>;
  hands: Pair<Card[]>;
  characters: Pair<Character[]>;
  nextTurn: 0 | 1;
  combatStatuses: Pair<Status[]>;
  supports: Pair<SupportFacade[]>;
  summons: Pair<SummonFacade[]>;
}

export interface InitHandsState extends WithPlayersState {
  type: "initHands";
}

interface WithActivesState extends WithPlayersState {
  actives: Pair<number>;
}

export interface InitActiveState extends WithActivesState {
  type: "initActive";
}

interface WithDiceState extends WithActivesState {
  roundNumber: number;
  dice: Pair<DiceType[]>;
}
export interface RollPhaseState extends WithDiceState {
  type: "rollPhase";
}

export interface ActionPhaseState extends WithDiceState {
  type: "actionPhase";
  turn: 0 | 1;
}

export interface EndPhaseState extends WithDiceState {
  type: "endPhase";
}

export interface GameEndState extends WithPlayersState {
  type: "gameEnd";
  winner?: 0 | 1;
}

export type State =
  | CoinTossState
  | InitHandsState
  | InitActiveState
  | RollPhaseState
  | ActionPhaseState
  | EndPhaseState
  | GameEndState;

export class StateManager {
  private state: State;
  private p0: Player;
  private p1: Player;

  constructor(private options: GameOptions) {
    this.state = {
      type: "coinToss",
    };
    [this.p0, this.p1] = options.players;
  }

  private async next() {
    switch (this.state.type) {
      case "coinToss": {
        if (Math.random() < 0.5) {
          [this.p0, this.p1] = [this.p1, this.p0];
        }
        console.log("Player 0 is", this.p0.id);
        console.log("Player 1 is", this.p1.id);
        const p0 = initPiles(this.p0.piles);
        const p1 = initPiles(this.p1.piles);
        this.state = {
          type: "initHands",
          players: [this.p0.id, this.p1.id],
          characters: [
            this.p0.characters.map(initCharacter),
            this.p1.characters.map(initCharacter),
          ],
          combatStatuses: [[], []],
          piles: [p0, p1],
          hands: [[], []],
          summons: [[], []],
          supports: [[], []],
          nextTurn: 0,
        };
        await Promise.all([
          this.requestPlayer(0, "initialize", {
            first: true,
            state: this.createFacade(0),
          }),
          this.requestPlayer(1, "initialize", {
            first: false,
            state: this.createFacade(1),
          }),
        ]);
        break;
      }
      case "initHands": {
        await Promise.all([
          this.drawHands(0, INITIAL_HANDS),
          this.drawHands(1, INITIAL_HANDS),
        ]);

        await Promise.all([this.switchHands(0), this.switchHands(1)]);
        this.state = {
          ...this.state,
          type: "initActive",
          actives: [0, 0],
        };
        break;
      }
      case "initActive": {
        await Promise.all([
          this.switchActive(0, "noNotify"),
          this.switchActive(1, "noNotify"),
        ]);
        this.switchActive(0, "justNotify");
        this.switchActive(1, "justNotify");
        this.state = {
          ...this.state,
          type: "rollPhase",
          roundNumber: 1,
          dice: [[], []],
        };
        break;
      }
      case "rollPhase": {
        if (this.state.roundNumber > MAX_ROUNDS) {
          this.state = {
            ...this.state,
            type: "gameEnd",
          };
          break;
        }
        this.notifyPlayer(
          {
            source: {
              type: "phaseBegin",
              phase: "roll",
              roundNumber: this.state.roundNumber,
              isFirst: this.state.nextTurn === 0,
            },
          },
          0
        );
        this.notifyPlayer(
          {
            source: {
              type: "phaseBegin",
              phase: "roll",
              roundNumber: this.state.roundNumber,
              isFirst: this.state.nextTurn === 1,
            },
          },
          1
        );
        await Promise.all([this.rollDice(0), this.rollDice(1)]);
        this.state = {
          ...this.state,
          type: "actionPhase",
          turn: this.state.nextTurn,
        };
        break;
      }
      case "actionPhase": {
        this.notifyPlayer({ source: { type: "phaseBegin", phase: "action" } });
        let declareEndNum = 0;
        while (declareEndNum < 2) {
          const curPlayer = this.state.turn;
          const scanner = new ActionScanner(this.state);
          const skills = scanner.scanSkills();
          // check onBeforeUseDice
          // check onBeforeSwitchShouldFast
          // check card "testEnabled"
          const availableCards = this.state.hands[curPlayer]; /* TODO */
          const { action } = await this.requestPlayer(curPlayer, "action", {
            skills: skills.map(({ name, cost }) => ({ name, cost })),
            cards: [], //availableCards,
            switchActive: {
              cost: [0], // TODO
              fast: false, // TODO
            },
          });
          // TODO: check onBeforeUseDice 2nd time; deduct usage count.
          switch (action.type) {
            case "declareEnd": {
              this.state.nextTurn = curPlayer;
              this.state.turn = flip(curPlayer);
              declareEndNum++;
              this.notifyPlayer(
                {
                  source: { type: "oppDeclareEnd" },
                },
                flip(curPlayer)
              );
              continue;
            }
            case "playCard": {
              const { card, with: w, removeSupport } = action;
              const cardObj = availableCards.find((c) => c.id === card);
              if (!cardObj) {
                throw new Error("Card not found");
              }
              // TODO play card
              this.state.hands[curPlayer] = this.state.hands[curPlayer].filter(
                (c) => c.id !== card
              );
              continue; // fast action
            }
            case "elementalTuning": {
              continue; // fast action
            }
            case "switchActive": {
              break;
            }
            case "useSkill": {
              const { name, cost } = action;
              const skillReq = skills.find((s) => s.name === name);
              if (!skillReq) {
                throw new Error("Skill not found");
              }
              // TODO reduce cost
              skillReq.action({
                ...this.createGlobalContext(curPlayer),
                triggeredByCard: undefined
              });
              break;
            }
          }
          if (!declareEndNum) {
            this.state.turn = flip(curPlayer);
          }
        }
        this.state = {
          ...this.state,
          // type: "endPhase",
          type: "gameEnd",
        };
        break;
      }
      case "endPhase": {
        this.notifyPlayer({ source: { type: "phaseBegin", phase: "end" } });
        break;
      }
      case "gameEnd": {
        console.log("GAME END!");
        this.requestPlayer(0, "gameEnd", { win: false });
        this.requestPlayer(1, "gameEnd", { win: false });
        break;
      }
    }
  }

  private updatePhase(phase: "roll" | "action" | "end") {
    this.notifyPlayer({
      source: {
        type: "phaseBegin",
        phase,
      },
    });
  }

  async requestPlayer<K extends MethodNames>(
    p: 0 | 1,
    method: K,
    params: RequestType<K>
  ): Promise<ResponseType<K>> {
    const pl = p ? this.p1 : this.p0;
    verifyRequest(method, params);
    // @ts-ignore
    const response = await pl.handler(method, params);
    verifyResponse(method, response);
    return response;
  }

  private notifyPlayer(event: Omit<Event, "state">, p?: 0 | 1) {
    if (typeof p === "undefined" || p === 0) {
      this.requestPlayer(0, "notify", {
        event: {
          ...event,
          state: this.createFacade(0),
        },
      }).catch(() => {});
    }
    if (typeof p === "undefined" || p === 1) {
      this.requestPlayer(1, "notify", {
        event: {
          ...event,
          state: this.createFacade(1),
        },
      }).catch(() => {});
    }
  }

  private ensureHands(state: State): asserts state is InitHandsState {
    if (!("hands" in state)) {
      throw new Error("bad state (hands)");
    }
  }

  private ensureActives(state: State): asserts state is InitActiveState {
    if (!("actives" in state)) {
      throw new Error("bad state (actives)");
    }
  }

  private ensureDice(
    state: State
  ): asserts state is RollPhaseState | ActionPhaseState | EndPhaseState {
    if (!("dice" in state)) {
      throw new Error("bad state (dice)");
    }
  }

  private sortHands(p: 0 | 1) {
    this.ensureHands(this.state);
    this.state.hands[p].sort((a, b) => a.id - b.id);
  }

  private async drawHands(p: 0 | 1, num = 2) {
    if (num === 0) return;
    this.ensureHands(this.state);
    const news = this.state.piles[p].splice(0, num);
    this.state.hands[p].push(...news);
    let discard: Card[] = [];
    if (this.state.hands[p].length > MAX_HANDS) {
      discard = this.state.hands[p].splice(MAX_HANDS);
    }
    await this.requestPlayer(p, "drawHands", {
      hands: news.map((c) => c.id),
      discard: discard.map((c) => c.id),
    });
    // notify opponent
    this.notifyPlayer(
      {
        source: {
          type: "oppSwitchHands",
          addNum: news.length as number,
          discardNum: discard.length as number,
        },
      },
      flip(p)
    );
    this.sortHands(p);
  }

  private async switchHands(p: 0 | 1) {
    this.ensureHands(this.state);
    const { remove } = await this.requestPlayer(p, "removeHands", {
      hands: this.state.hands[p].map((x) => x.id),
    });
    const removedCards: Card[] = [];
    for (const c of remove) {
      const i = this.state.hands[p].findIndex((x) => x.id === c);
      if (i === -1) {
        throw new Error("bad removed hands");
      }
      removedCards.push(...this.state.hands[p].splice(i, 1));
    }
    this.state.piles[p] = _.shuffle([...this.state.piles[p], ...removedCards]);
    // notify opponent
    this.notifyPlayer(
      {
        source: {
          type: "oppSwitchHands",
          removeNum: remove.length,
        },
      },
      flip(p)
    );
    this.drawHands(p, remove.length);
  }

  private async switchActive(
    p: 0 | 1,
    notify: "notify" | "noNotify" | "justNotify" = "notify"
  ) {
    this.ensureActives(this.state);
    let target = this.state.actives[p];
    if (notify !== "justNotify") {
      ({ target } = await this.requestPlayer(p, "switchActive", {}));
      this.state.actives[p] = target;
    }
    if (notify !== "noNotify") {
      this.notifyPlayer(
        {
          source: {
            type: "switchActive",
            target: target,
          },
        },
        p
      );
      this.notifyPlayer(
        {
          source: {
            type: "switchActive",
            target: target + 3,
          },
        },
        flip(p)
      );
    }
  }

  private rerollRandomDice(original: number[], removed: number[]) {
    for (const d of removed) {
      const i = original.indexOf(d);
      if (i === -1) {
        throw new Error("bad removed dice");
      }
      original.splice(i, 1);
    }
    return randomDice(original);
  }

  private async rollDice(p: 0 | 1, rerollCount = 1) {
    this.ensureDice(this.state);
    let dice = [...this.state.dice[p]];
    if (this.state.type === "rollPhase") {
      // TODO SCAN HOOKS
      dice = randomDice();
    }
    let { remove } = await this.requestPlayer(p, "roll", {
      dice,
      canRemove: rerollCount !== 0,
    });
    for (let i = 1; i <= rerollCount; i++) {
      if (remove.length === 0) break;
      dice = this.rerollRandomDice(dice, remove);
      ({ remove } = await this.requestPlayer(p, "roll", {
        dice,
        canRemove: i != rerollCount,
      }));
    }
    this.state.dice[p] = dice;
  }

  private createFacade(p: 0 | 1): StateFacade {
    if (!("hands" in this.state)) {
      throw new Error("bad state");
    }
    return {
      pileNumber: this.state.piles[p].length,
      hands: [...this.state.hands[p].map((c) => c.id)],
      active: "actives" in this.state ? this.state.actives[p] : undefined,
      characters: this.state.characters[p].map((c) => c.toFacade()),
      combatStatuses: this.state.combatStatuses[p].map((c) => c.toFacade()),
      supports: [...this.state.supports[p]],
      summons: [...this.state.summons[p]],
      dice: "dice" in this.state ? [...this.state.dice[p]] : [],
      oppPileNumber: this.state.piles[1 - p].length,
      oppHandsNumber: this.state.hands[1 - p].length,
      oppActive:
        "actives" in this.state ? this.state.actives[1 - p] : undefined,
      oppCharacters: this.state.characters[1 - p].map((c) => c.toFacade()),
      oppCombatStatuses: this.state.combatStatuses[1 - p],
      oppSupports: [...this.state.supports[1 - p]],
      oppSummons: [...this.state.summons[1 - p]],
      oppDiceNumber: "dice" in this.state ? this.state.dice[1 - p].length : 0,
    };
  }

  // TODO working
  private createGlobalContext(who?: 0 | 1): Context {
    this.ensureDice(this.state);
    if (typeof who === "undefined") {
      if (!("turn" in this.state)) {
        throw new Error(`creating state at roll phase, and no player selected`);
      }
      who = this.state.turn;
    }
  }

  public async run(): Promise<GameEndState> {
    while (true) {
      let isEnd = this.state.type === "gameEnd";
      await this.next();
      if (isEnd && this.state.type === "gameEnd") {
        return this.state;
      }
    }
  }
}
