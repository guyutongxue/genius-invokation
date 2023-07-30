import { DamageData, DamageType } from "@gi-tcg/typings";
import { CharacterPath, heal } from "./character.js";
import { EntityPath } from "./entity.js";
import { PlayerIO } from "./io.js";
import { PlayerMutator } from "./player.js";
import { Store, getCharacterAtPath } from "./store.js";
import { DamageContextImpl } from "./context.js";
import { Context, DamageContext, makeReactionFromDamage } from "@gi-tcg/data";
import { Damage } from "./damage.js";

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
  
  private doElementalReaction(damageCtx: Context<never, DamageContext, true>) {
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
    const damage = new Damage(source, target, value, type);
    const dmgCtx = new DamageContextImpl(this.store, source, damage);
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
      if (source.type === "skill") {
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
          source: source.info.id,
          what: `Original damage ${value} with type ${type}`,
        },
        ...damage.changedLogs.map(([s, c]) => ({
          source: JSON.stringify(s),
          what: `Change damage type to ${c}`,
        })),
        ...damage.addedLogs.map(([s, c]) => ({
          source: JSON.stringify(s),
          what: `+${c}`,
        })),
        ...damage.multipliedLogs.map(([s, c]) => ({
          source: JSON.stringify(s),
          what: `*${c}`,
        })),
        ...damage.decreasedLogs.map(([s, c]) => ({
          source: JSON.stringify(s),
          what: `-${c}`,
        })),
      ],
    };
    this.playerIO[0]?.notifyMe({ type: "stateUpdated", damages: [damageLog] });
    this.playerIO[1]?.notifyMe({ type: "stateUpdated", damages: [damageLog] });
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
    this.playerIO[0]?.notifyMe({ type: "stateUpdated", damages: [damageLog] });
    this.playerIO[1]?.notifyMe({ type: "stateUpdated", damages: [damageLog] });
  }

  cleanSkillLog() {
    this.store._produce((draft) => {
      draft.skillDamageLog = [];
      draft.skillReactionLog = [];
    });
  }

  applyElement(source: EntityPath, target: CharacterPath, type: DamageType) {
    // TODO
  }
}
