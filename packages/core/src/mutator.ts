import { DamageData, DamageType } from "@gi-tcg/typings";
import { CharacterPath, heal } from "./character.js";
import { AllEntityState, EntityPath } from "./entity.js";
import { PlayerIO } from "./io.js";
import { PlayerMutator } from "./player.js";
import {
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

export class Mutator {
  readonly players: readonly [PlayerMutator, PlayerMutator];

  constructor(private store: Store) {
    this.players = [new PlayerMutator(store, 0), new PlayerMutator(store, 1)];
  }

  private doElementalReaction(damage: Damage) {
    const dmgCtx = new DamageContextImpl(this.store, damage.source, damage);
    const [newAura, reaction] = makeReactionFromDamage(
      mixinExt(this.store, damage.source, dmgCtx),
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
    const damage = new Damage(source, target, value, type);
    this.doElementalReaction(damage);
    this.emitSyncEvent("onEarlyBeforeDealDamage", damage);
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
        this.store.updateCharacterAtPath(target, (draft) => {
          draft.defeated = true;
          draft.statuses = [];
          draft.equipments = [];
        });
        this.emitEvent("onDefeated", target);
      } else {
        this.heal(
          defeatedToken.immune.source,
          target,
          defeatedToken.immune.healTo,
        );
      }
    }
    const ioData = damage.toData();
    this.store._playerIO[0]?.notifyMe({
      type: "stateUpdated",
      damages: [ioData],
    });
    this.store._playerIO[1]?.notifyMe({
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
    this.store._playerIO[0]?.notifyMe({
      type: "stateUpdated",
      damages: [damageLog],
    });
    this.store._playerIO[1]?.notifyMe({
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
    const pseudoDamage = new Damage(source, target, 0, type);
    this.doElementalReaction(pseudoDamage);
  }

  private checkDispose() {
    const playerSeq = [
      this.store.state.currentTurn,
      flip(this.store.state.currentTurn),
    ];
    this.store._produce((draft) => {
      for (const idx of playerSeq) {
        const player = draft.players[idx];
        const activeIndex = player.characters.findIndex(
          (ch) => ch.entityId === player.active?.entityId,
        );
        for (let i = 0; i < player.characters.length; i++) {
          const character =
            player.characters[(activeIndex + i) % player.characters.length];
          for (let j = 0; j < character.statuses.length; j++) {
            if (character.statuses[j].shouldDispose) {
              character.statuses.splice(j, 1);
              j--;
            }
          }
        }
        for (let i = 0; i < player.combatStatuses.length; i++) {
          if (player.combatStatuses[i].shouldDispose) {
            player.combatStatuses.splice(i, 1);
            i--;
          }
        }
        for (let i = 0; i < player.summons.length; i++) {
          if (player.summons[i].shouldDispose) {
            player.summons.splice(i, 1);
            i--;
          }
        }
        for (let i = 0; i < player.supports.length; i++) {
          if (player.supports[i].shouldDispose) {
            player.supports.splice(i, 1);
            i--;
          }
        }
      }
    });
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
          if (draft.usage <= 0) {
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
  }
  private pendingEvent: AsyncEventDescriptor[] = [];
  async doEvent() {
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
  }

  emitEvent<E extends keyof AsyncEventMap>(e: E, ...args: CreatorArgs<E>) {
    const factory = (CONTEXT_CREATORS[e] as any)(...args);
    this.pendingEvent.push([e, factory]);
  }
  emitSyncEvent<E extends keyof SyncEventMap>(e: E, ...args: CreatorArgs<E>) {
    const factory = (CONTEXT_CREATORS[e] as any)(...args);
    this.store.clone().mutator.propagateSyncEvent([e, factory]);
  }
}
