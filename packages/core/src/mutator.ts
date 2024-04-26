import { ExposedMutation } from "@gi-tcg/typings";
import { GameState } from "./base/state";
import { DetailLogType, IDetailLogger } from "./log";
import { Mutation, applyMutation, stringifyMutation } from "./base/mutation";
import { exposeMutation } from "./io";

export interface NotifyOption {
  canResume?: boolean;
  mutations?: readonly ExposedMutation[];
}

export interface InternalNotifyOption {
  state: GameState;
  canResume: boolean;
  /** 自上次通知后，对局状态发生的所有变化 */
  stateMutations: readonly Mutation[];
  /** 上层传入的其他变化（可直接输出前端） */
  exposedMutations: readonly ExposedMutation[];
}

export interface MutateOption {
  /**
   * 详细日志输出器。
   */
  logger?: IDetailLogger;
}

/**
 * 管理一个状态和状态的修改。
 *
 * - 当状态发生修改时，向日志输出；
 * - `notify` 方法会附加所有的修改信息。
 */
export abstract class StateMutator {
  protected _state: GameState;
  private _lastNotifiedState: GameState | null = null;
  private _mutations: Mutation[] = [];
  get state() {
    return this._state;
  }
  constructor(
    initialState: GameState,
    private opt: MutateOption = {},
  ) {
    this._state = initialState;
  }
  protected log(type: DetailLogType, value: string): void {
    return this.opt.logger?.log(type, value);
  }
  protected subLog(type: DetailLogType, value: string) {
    return this.opt.logger?.subLog(type, value);
  }
  protected mutate(mutation: Mutation) {
    this._state = applyMutation(this.state, mutation);
    const str = stringifyMutation(mutation);
    if (str) {
      this.log(DetailLogType.Mutation, str);
    }
    this._mutations.push(mutation);
  }
  private createInternalOption(opt: NotifyOption): InternalNotifyOption {
    const result = {
      state: this.state,
      canResume: opt.canResume ?? false,
      stateMutations: this._mutations,
      exposedMutations: opt.mutations ?? [],
    };
    this._mutations = [];
    return result;
  }
  protected notify(opt: NotifyOption = {}) {
    const internalOpt = this.createInternalOption(opt);
    if (
      internalOpt.state !== this._lastNotifiedState ||
      internalOpt.stateMutations.length > 0 ||
      internalOpt.exposedMutations.length > 0
    ) {
      this.onNotify(internalOpt);
    }
  }
  protected async notifyAndPause(opt: NotifyOption = {}) {
    const internalOpt = this.createInternalOption(opt);
    if (
      internalOpt.state !== this._lastNotifiedState ||
      internalOpt.stateMutations.length > 0 ||
      internalOpt.exposedMutations.length > 0
    ) {
      this.onNotify(internalOpt);
    }
    await this.onPause(internalOpt);
  }

  /**
   * 当上层调用 `StateMutator.prototype.notify` 时，调用的接口。
   * 子类重写此接口以实现提示功能
   */
  protected abstract onNotify(opt: InternalNotifyOption): void;
  protected abstract onPause(opt: InternalNotifyOption): Promise<void>;

  protected drawCard(who: 0 | 1) {
    const candidate = this.state.players[who].piles[0];
    if (typeof candidate === "undefined") {
      return;
    }
    this.mutate({
      type: "transferCard",
      path: "pilesToHands",
      who,
      value: candidate,
    });
    if (this.state.players[who].hands.length > this.state.config.maxHands) {
      this.mutate({
        type: "removeCard",
        who,
        oldState: candidate,
        used: false,
      });
    }
  }
}
