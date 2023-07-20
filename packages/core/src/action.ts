import { Card } from "./card.js";
import { Summon } from "./summon.js";
import { Character } from "./character.js";
import {
  Action,
  ActionRequest,
  ActionResponse,
  DiceType,
  PlayCardAction,
  PlayCardActionResponse,
  SwitchActiveActionResponse,
  UseSkillActionResponse,
} from "@gi-tcg/typings";
import { Skill } from "./skill.js";
import * as _ from "lodash-es";

export type UseSkillConfig = {
  type: "useSkill";
  dice: DiceType[];
  skill: Skill;
};

export type PlayCardTargetObj = Summon | Character;

export type PlayCardConfig = {
  type: "playCard";
  dice: DiceType[];
  card: Card;
  targets: PlayCardTargetObj[];
};

export type SwitchActiveConfig = {
  type: "switchActive";
  dice: DiceType[];
  from: Character;
  to: Character;
  fast: boolean;
};

export type ElementalTuningActionConfig = {
  type: "elementalTuning";
  card: Card;
};

export type DeclareEndActionConfig = {
  type: "declareEnd";
};

export type ActionConfig =
  | UseSkillConfig
  | PlayCardConfig
  | SwitchActiveConfig
  | ElementalTuningActionConfig
  | DeclareEndActionConfig;

export async function rpcAction(
  actions: ActionConfig[],
  req2rep: (r: ActionRequest) => Promise<ActionResponse>
): Promise<ActionConfig & { consumedDice: DiceType[] }> {
  const candidates: Action[] = [];
  const cards = new Map<number, PlayCardConfig[]>();
  for (const action of actions) {
    switch (action.type) {
      case "declareEnd": {
        candidates.push({ type: "declareEnd" });
        break;
      }
      case "elementalTuning": {
        candidates.push({
          type: "elementalTuning",
          discardedCard: action.card.entityId
        });
        break;
      }
      case "useSkill": {
        candidates.push({
          type: "useSkill",
          cost: action.dice,
          skill: action.skill.info.id,
        });
        break;
      }
      case "playCard": {
        const cardId = action.card.entityId;
        if (!cards.has(cardId)) {
          cards.set(cardId, []);
        }
        cards.get(cardId)!.push(action);
        break;
      }
      case "switchActive": {
        candidates.push({
          type: "switchActive",
          cost: action.dice,
          active: action.to.entityId,
        });
        break;
      }
    }
  }
  for (const [cardId, actions] of cards) {
    candidates.push({
      type: "playCard",
      cost: actions[0].dice,
      card: cardId,
      target: {
        candidates: actions.map((a) =>
          a.targets.map((t) => ({
            id: t.info.id,
            entityId: t.entityId,
          }))
        ),
      },
    });
  }
  const response = await req2rep({ candidates });
  let cfg: ActionConfig | undefined;
  switch (response.type) {
    case "declareEnd": {
      cfg = actions.find((c) => c.type === "declareEnd");
      break;
    }
    case "elementalTuning": {
      cfg = actions.find((c) => c.type === "elementalTuning" && c.card.entityId === response.discardedCard);
      if (response.dice.includes(DiceType.Omni)) {
        throw new Error("Cannot tune omni dice");
      }
      if (response.dice.length !== 1) {
        throw new Error("Must tune exactly one dice");
      }
      break;
    }
    case "switchActive": {
      cfg = actions.find(
        (c) => c.type === "switchActive" && c.to.entityId === response.active
      );
      break;
    }
    case "useSkill": {
      cfg = actions.find(
        (c) => c.type === "useSkill" && c.skill.info.id === response.skill
      );
      break;
    }
    case "playCard": {
      const reqItem = candidates.find(
        (c): c is PlayCardAction =>
          c.type === "playCard" && c.card === response.card
      );
      if (!reqItem) {
        throw new Error("card action not found");
      }
      const reqTargets = reqItem.target?.candidates ?? [[]];
      const resTargetIndex = response.targetIndex ?? 0;
      cfg = actions.find(
        (c) =>
          c.type === "playCard" &&
          c.card.entityId === response.card &&
          _.isEqual(
            c.targets.map((t) => t.entityId),
            reqTargets[resTargetIndex].map((t) => t.entityId)
          )
      );
    }
  }
  if (typeof cfg === "undefined") {
    throw new Error(`Response action could not be found`);
  }
  return {
    ...cfg,
    consumedDice: "dice" in response ? response.dice : []
  };
}

export type NontrivialActionResponse =
  | SwitchActiveActionResponse
  | UseSkillActionResponse
  | PlayCardActionResponse;
