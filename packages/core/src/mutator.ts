import { DamageType } from "@gi-tcg/typings";
import { CharacterPath } from "./character.js";
import { EntityPath } from "./entity.js";
import { PlayerIO } from "./io.js";
import { PlayerMutator } from "./player.js";
import { Store } from "./store.js";
import { DamageContextImpl } from "./context.js";
import { makeReactionFromDamage } from "@gi-tcg/data";

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
  
  private doElementalReaction(damageCtx: DamageContextImpl) {
    const [newAura, reaction] = makeReactionFromDamage(damageCtx);
    damageCtx.target.character.applied = newAura;
    if (reaction !== null) {
      this.emitEvent(
        "onElementalReaction",
        damageCtx.who,
        damageCtx.sourceId,
        reaction
      );
      this.reactionLog.push([damageCtx.who, damageCtx.sourceId, reaction]);
    }
  }

  dealDamage(
    source: EntityPath,
    target: CharacterPath,
    value: number,
    type: DamageType
  ) {
    const { who, master, entity } = getEntityById(this, sourceId)!;
    const targetWho = this.players.findIndex((p) =>
      p.characters.includes(target)
    ) as 0 | 1;
    const damage = new Damage(who, sourceId, target, value, type);
    const dmgCtx = new DamageContextImpl(this, who, sourceId, damage);
    this.doElementalReaction(dmgCtx);
    this.emitImmediatelyHandledEvent(
      "onEarlyBeforeDealDamage",
      damage,
      who,
      targetWho,
      master
    );
    const changedType = damage.getType();
    if (changedType !== DamageType.Piercing) {
      this.emitImmediatelyHandledEvent(
        "onBeforeDealDamage",
        damage,
        who,
        targetWho,
        master
      );
      if (entity instanceof Skill) {
        this.emitImmediatelyHandledEvent(
          "onBeforeSkillDamage",
          damage,
          who,
          targetWho,
          master
        );
      }
      this.emitImmediatelyHandledEvent(
        "onBeforeDamaged",
        damage,
        who,
        targetWho,
        master
      );
    }
    target.health -= damage.getValue();
    if (target.health < 0) {
      target.health = 0;
    }
    this.emitEvent("onDamaged", damage, who, targetWho, master);
    this.damageLog.push([damage, who, targetWho, master]);
    const damageLog: DamageData = {
      target: target.entityId,
      type: damage.getType(),
      value: damage.getValue(),
      log: [
        {
          source: entity instanceof Skill ? entity.info.id : entity.entityId,
          what: `Original damage ${value} with type ${type}`,
        },
        ...damage.changedLogs.map(([s, c]) => ({
          source: s,
          what: `Change damage type to ${c}`,
        })),
        ...damage.addedLogs.map(([s, c]) => ({
          source: s,
          what: `+${c} by ${s}`,
        })),
        ...damage.multipliedLogs.map(([s, c]) => ({
          source: s,
          what: `*${c} by ${s}`,
        })),
        ...damage.decreasedLogs.map(([s, c]) => ({
          source: s,
          what: `-${c} by ${s}`,
        })),
      ],
    };
    this.playerIO[0]?.notifyMe({ type: "stateUpdated", damages: [damageLog] });
    this.playerIO[1]?.notifyMe({ type: "stateUpdated", damages: [damageLog] });
  }

  heal(source: EntityPath, target: CharacterPath, value: number) {
    const oldHealth = target.health;
    target.health = Math.min(target.health + value, target.info.maxHealth);
    const diff = target.health - oldHealth;
    const damageLog: DamageData = {
      target: target.entityId,
      value: diff,
      type: DamageType.Heal,
      log: [
        {
          source: sourceId,
          what: `Heal ${value}(${diff}) HP`,
        },
      ],
    };
    this.notifyPlayer(0, { type: "stateUpdated", damages: [damageLog] });
    this.notifyPlayer(1, { type: "stateUpdated", damages: [damageLog] });
  }

  applyElement(source: EntityPath, target: CharacterPath, type: DamageType) {
    // TODO
  }
}
