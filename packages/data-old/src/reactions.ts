import { REACTION_HANDLERS, RContext } from "../data/reactions/handlers";
import { REACTION_MAP } from "../data/reactions";
import { Aura, DamageType as D, Reaction } from "@gi-tcg/typings";

/**
 * Make an elemental reaction.
 * @param c "before damaged" context (stage 2)
 * @returns [newAura, reaction]
 */
export function makeReactionFromDamage(c: RContext): [Aura, Reaction | null] {
  const aura = c.target.aura;
  const damage = c.damageType;
  if (damage === D.Physical || damage === D.Piercing || damage === D.Heal) {
    return [aura, null];
  }
  const [newAura, reaction] = REACTION_MAP[aura][damage];
  if (reaction !== null) {
    // @ts-expect-error internal method
    c.setTriggeredByReaction(reaction);
    REACTION_HANDLERS[reaction](c);
  }
  return [newAura, reaction];
}

export function makeReaction(a: Aura, d: Exclude<D, D.Physical | D.Piercing | D.Heal>): [Aura, Reaction | null] {
  return REACTION_MAP[a][d];
}

export { REACTION_MAP };
