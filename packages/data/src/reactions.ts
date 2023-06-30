import { REACTION_HANDLERS } from "../data/reactions/handlers";
import { REACTION_MAP } from "../data/reactions";
import { Aura, DamageType as D, Reaction } from "@gi-tcg/typings";
import { DamageContext } from ".";

/**
 * Make an elemental reaction.
 * @param c "before damaged" context (stage 2)
 * @returns [newAura, reaction]
 */
export function makeReaction(c: DamageContext): [Aura, Reaction | null] {
  const aura = c.target.aura;
  const damage = c.damageType;
  if (damage === D.Physical || damage === D.Piercing || damage === D.Heal) {
    return [aura, null];
  }
  const [newAura, reaction] = REACTION_MAP[aura][damage];
  if (reaction !== null) {
    REACTION_HANDLERS[reaction](c);
  }
  return [newAura, reaction];
}
