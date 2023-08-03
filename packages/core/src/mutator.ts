import { Aura, DamageData, DamageType, Event } from "@gi-tcg/typings";
import { CharacterPath, heal } from "./character.js";
import { AllEntityState, EntityPath } from "./entity.js";
import { PlayerIO } from "./io.js";
import { PlayerMutator } from "./player.js";
import {
  GameState,
  Store,
  findCharacter,
  findEntity,
  getCharacterAtPath,
  getEntityAtPath,
} from "./store.js";
import {
  AnyEventDescriptor,
  AsyncEventDescriptor,
  CONTEXT_CREATORS,
  CreatorArgs,
  DamageContextImpl,
  DefeatedToken,
  mixinExt,
} from "./context.js";
import {
  AsyncEventMap,
  Context,
  DamageContext,
  SyncEventMap,
  SyncHandlerResult,
  makeReactionFromDamage,
} from "@gi-tcg/data";
import { Damage, DamageLogType } from "./damage.js";
import { flip } from "@gi-tcg/utils";
import { Draft } from "immer";
import * as _ from "lodash-es";
import { ActionConfig } from "./action.js";

export class Mutator {
  readonly players: readonly [PlayerMutator, PlayerMutator];

  constructor(private store: Store) {
    this.players = [new PlayerMutator(store, 0), new PlayerMutator(store, 1)];
  }

  private notifyAll(event: Event) {
    this.store._playerIO[0]?.notifyMe(event);
    this.store._playerIO[1]?.notifyMe(event);
  }

  private doElementalReaction(damage: Damage, hasDamage = true) {
    const dmgCtx = new DamageContextImpl(this.store, damage.source, damage);
    Object.defineProperty(dmgCtx, "hasDamage", {
      value: hasDamage,
    });
    const [newAura, reaction] = makeReactionFromDamage(
      mixinExt(
        this.store,
        damage.source,
        dmgCtx as DamageContextImpl & { hasDamage: boolean },
      ),
    );
    this.store.updateCharacterAtPath(damage.target, (draft) => {
      draft.aura = newAura;
    });
    if (reaction !== null) {
      this.emitEvent("onElementalReaction", reaction);
      this.store._produce((draft) => {
        draft.skillReactionLog.push(reaction);
      });
    }
  }

  dealDamage(
    source: EntityPath,
    target: CharacterPath,
    value: number,
    type: DamageType,
  ) {
    const targetAura = getCharacterAtPath(this.store.state, target).aura;
    const damage = new Damage(source, target, value, type, targetAura);
    this.emitSyncEvent("onEarlyBeforeDealDamage", damage);
    this.doElementalReaction(damage);
    const changedType = damage.getType();
    if (changedType !== DamageType.Piercing) {
      this.emitSyncEvent("onBeforeDealDamage", damage);
      if (source.type === "skill") {
        this.emitSyncEvent("onBeforeSkillDamage", damage);
      }
      this.emitSyncEvent("onBeforeDamaged", damage);
    }
    let shouldDefeated = false;
    this.store.updateCharacterAtPath(target, (draft) => {
      draft.health -= damage.getValue();
      if (draft.health <= 0) {
        draft.health = 0;
        shouldDefeated = true;
      }
    });
    this.emitEvent("onDamaged", damage);
    this.store._produce((draft) => {
      draft.skillDamageLog.push(damage.toLogType() as Draft<DamageLogType>);
    });
    if (shouldDefeated) {
      const defeatedToken: DefeatedToken = {
        immune: null,
      };
      this.emitSyncEvent("onBeforeDefeated", target, defeatedToken);
      if (defeatedToken.immune === null) {
        this.emitEvent("onDefeated", damage);
        // 检查是否所有角色均已死亡：游戏结束
        if (
          this.store.state.players[target.who].characters.every(
            (ch) => ch.defeated,
          )
        ) {
          this.gameEnd(flip(target.who));
        }
      } else {
        this.heal(
          defeatedToken.immune.source,
          target,
          defeatedToken.immune.healTo,
        );
      }
    }
    const ioData = damage.toData();
    this.notifyAll({
      type: "stateUpdated",
      damages: [ioData],
    });
  }

  heal(source: EntityPath, target: CharacterPath, value: number) {
    const oldHealth = getCharacterAtPath(this.store.state, target).health;
    this.store.updateCharacterAtPath(target, (ch) => heal(ch, value));
    const newHealth = getCharacterAtPath(this.store.state, target).health;
    const diff = newHealth - oldHealth;
    const damageLog: DamageData = {
      target: target.entityId,
      value: diff,
      type: DamageType.Heal,
      log: [
        {
          source: JSON.stringify(source),
          what: `Heal ${value}(${diff}) HP`,
        },
      ],
    };
    this.notifyAll({
      type: "stateUpdated",
      damages: [damageLog],
    });
  }

  revive(source: EntityPath, target: CharacterPath, value: number) {
    this.store.updateCharacterAtPath(target, (ch) => {
      ch.defeated = false;
      ch.health = 0;
    });
    this.heal(source, target, value);
  }

  cleanSkillLog() {
    this.store._produce((draft) => {
      draft.skillDamageLog = [];
      draft.skillReactionLog = [];
    });
  }

  applyElement(source: EntityPath, target: CharacterPath, type: DamageType) {
    if (
      !(
        type === DamageType.Cryo ||
        type === DamageType.Hydro ||
        type === DamageType.Electro ||
        type === DamageType.Pyro ||
        type === DamageType.Dendro
      )
    ) {
      throw new Error(`Invalid applied element type ${type}`);
    }
    const targetAura = getCharacterAtPath(this.store.state, target).aura;
    const pseudoDamage = new Damage(source, target, 0, type, targetAura);
    this.doElementalReaction(pseudoDamage, false);
  }

  private checkDispose() {
    const playerSeq = [
      this.store.state.currentTurn,
      flip(this.store.state.currentTurn),
    ];
    for (const idx of playerSeq) {
      for (const [, chPath] of findCharacter(this.store.state, idx)) {
        for (const [st, stPath] of findEntity(
          this.store.state,
          chPath,
          "status",
        )) {
          if (st.shouldDispose) {
            this.emitSyncEvent("onDispose", stPath);
            this.store.updateCharacterAtPath(chPath, (draft) => {
              draft.statuses = draft.statuses.filter(
                (s) => s.entityId !== st.entityId,
              );
            });
          }
        }
      }
      for (const type of ["status", "summon", "support"] as const) {
        for (const [e, path] of findEntity(this.store.state, idx, type)) {
          if (e.shouldDispose) {
            this.emitSyncEvent("onDispose", path);
            this.store._produce((draft) => {
              const player = draft.players[idx];
              const prop =
                type === "status"
                  ? "combatStatuses"
                  : type === "summon"
                  ? "summons"
                  : "supports";
              player[prop] = (player[prop] as any[]).filter(
                (s) => s.entityId !== e.entityId,
              );
            });
          }
        }
      }
    }
  }

  private receiveEvent(
    target: EntityPath,
    d: AnyEventDescriptor,
    async?: false,
  ): void;
  private receiveEvent(
    target: EntityPath,
    d: AnyEventDescriptor,
    async: true,
  ): Promise<void>;
  private receiveEvent(
    target: EntityPath,
    [e, ctxFactory]: AnyEventDescriptor,
    async = false,
  ): void | Promise<void> {
    if (e === "onActionPhase") {
      this.store.updateEntityAtPath(target, (draft) => {
        draft.duration--;
        if (draft.duration <= 0) {
          draft.shouldDispose = true;
        } else if ("usagePerRound" in draft.info) {
          draft.usagePerRound = draft.info.usagePerRound;
        }
      });
    }
    const ctx = ctxFactory(this.store, target);
    const entity = getEntityAtPath(this.store.state, target);
    const h = entity.info.handler.handler[e];
    if (
      ctx === null ||
      typeof h === "undefined" ||
      entity.shouldDispose ||
      entity.usagePerRound <= 0
    ) {
      return;
    }
    const postOp = (result: SyncHandlerResult) => {
      if (typeof result === "undefined" || result === true) {
        this.store.updateEntityAtPath(target, (draft) => {
          draft.usage--;
          draft.usagePerRound--;
          if (
            draft.usage <= 0 &&
            (!("disposeWhenUsedUp" in draft.info) ||
              draft.info.disposeWhenUsedUp)
          ) {
            draft.shouldDispose = true;
          }
        });
      }
    };
    if (async) {
      return (async () => await h(ctx as any))().then(postOp);
    } else {
      const result = h(ctx as any);
      if (typeof result === "object" && "then" in result) {
        throw new Error("Cannot handle async event in sync mode");
      }
      postOp(result);
    }
  }

  private propagateSyncEvent(ed: AnyEventDescriptor): void {
    const playerSeq = [
      this.store.state.currentTurn,
      flip(this.store.state.currentTurn),
    ];
    for (const idx of playerSeq) {
      for (const [, chPath] of findCharacter(this.store.state, idx)) {
        for (const type of ["passive_skill", "equipment", "status"] as const) {
          for (const [, path] of findEntity(this.store.state, chPath, type)) {
            this.receiveEvent(path, ed);
          }
        }
      }
      for (const type of ["status", "summon", "support"] as const) {
        for (const [, path] of findEntity(this.store.state, idx, type)) {
          this.receiveEvent(path, ed);
        }
      }
    }
  }

  private async *propagateAsyncEvent(ed: AnyEventDescriptor) {
    const playerSeq = [
      this.store.state.currentTurn,
      flip(this.store.state.currentTurn),
    ];
    const defeatedChs = findCharacter(
      this.store.state,
      "all",
      (ch) => ch.health === 0,
    );
    if (ed[0] === "onDefeated") {
      // 出战角色死亡，需要重新选择的玩家
      const pendingChosen: (0 | 1)[] = [];
      for (const [, chPath] of defeatedChs) {
        if (
          chPath.entityId ===
          this.store.state.players[chPath.who].active?.entityId
        ) {
          this.store.updateCharacterAtPath(chPath, (draft) => {
            draft.defeated = true;
          });
          this.store._produce((draft) => {
            draft.players[chPath.who].active = null;
          });
          pendingChosen.push(chPath.who);
        }
      }
      await Promise.all(
        pendingChosen.map((idx) => this.players[idx].chooseActive()),
      );
    }

    for (const idx of playerSeq) {
      for (const [, chPath] of findCharacter(this.store.state, idx)) {
        for (const type of ["passive_skill", "equipment", "status"] as const) {
          for (const [, path] of findEntity(this.store.state, chPath, type)) {
            await this.receiveEvent(path, ed, true);
            yield;
          }
        }
      }
      for (const type of ["status", "summon", "support"] as const) {
        for (const [, path] of findEntity(this.store.state, idx, type)) {
          await this.receiveEvent(path, ed, true);
          yield;
        }
      }
    }

    if (ed[0] === "onDefeated") {
      defeatedChs.forEach(([, chPath]) => {
        this.store.updateCharacterAtPath(chPath, (draft) => {
          draft.aura = Aura.None;
          draft.energy = 0;
          draft.equipments = [];
          draft.statuses = [];
        });
        this.store._produce((draft) => {
          draft.players[chPath.who].hasDefeated = true;
        });
      });
    }
  }
  private pendingEvent: AsyncEventDescriptor[] = [];
  private previousState: GameState | null = null;
  async doEvent() {
    if (this.store.state.phase === "gameEnd") {
      return;
    }
    this.checkDispose();
    const sorted = _.sortBy(this.pendingEvent, ([e]) => {
      if (e === "onSwitchActive") {
        return -100;
      } else if (e === "onDefeated") {
        return -10;
      } else {
        return 0;
      }
    });
    this.pendingEvent = [];
    for (const desc of sorted) {
      for await (const _ of this.propagateAsyncEvent(desc)) {
        await this.doEvent();
      }
    }
    if (this.store.state !== this.previousState) {
      this.notifyAll({
        type: "stateUpdated",
        damages: [],
      });
      this.previousState = this.store.state;
    }
  }

  emitEvent<E extends keyof AsyncEventMap>(e: E, ...args: CreatorArgs<E>) {
    const factory = (CONTEXT_CREATORS[e] as any)(...args);
    this.pendingEvent.push([e, factory]);
  }
  emitSyncEvent<E extends keyof SyncEventMap>(e: E, ...args: CreatorArgs<E>) {
    const factory = (CONTEXT_CREATORS[e] as any)(...args);
    this.propagateSyncEvent([e, factory]);
  }
  emitBeforeUseDice(who: 0 | 1, action: ActionConfig): GameState {
    const previewStore = this.store.clone();
    const factory = CONTEXT_CREATORS.onBeforeUseDice(who, action);
    previewStore.mutator.propagateSyncEvent(["onBeforeUseDice", factory]);
    return previewStore.state;
  }

  gameEnd(winner: 0 | 1 | null = null) {
    this.store._produce((draft) => {
      draft.phase = "gameEnd";
      draft.winner = winner;
    });
  }
}
