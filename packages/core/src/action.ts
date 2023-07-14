import { Card } from "./card.js";
import { Summon } from "./summon.js";
import { Character } from "./character.js";
import { Action, ActionRequest, ActionResponse, DiceType, PlayCardActionResponse, SwitchActiveActionResponse, UseSkillActionResponse } from "@gi-tcg/typings";
import { Skill } from "./skill.js";
import { Player } from "./player.js";

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
};

export type OtherActionConfig = never;
// {
//   type: "declareEnd" | "elementalTuning";
//   dice: DiceType[];
// };

export type ActionConfig =
  | UseSkillConfig
  | PlayCardConfig
  | SwitchActiveConfig
  | OtherActionConfig;

export function actionToRpcRequest(actions: ActionConfig[]): ActionRequest {
  const results: Action[] = [];
  const cards = new Map<number, PlayCardConfig[]>();
  for (const action of actions) {
    switch (action.type) {
      case "useSkill": {
        results.push({
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
        results.push({
          type: "switchActive",
          cost: action.dice,
          active: action.to.entityId,
        });
        break;
      }
    }
  }
  for (const [cardId, actions] of cards) {
    results.push({
      type: "playCard",
      cost: actions[0].dice,
      card: cardId,
      target: {
        candidates: actions.map((a) => a.targets.map((t) => ({
          id: t.info.id,
          entityId: t.entityId,
        })))
      },
    });
    results.push({
      type: "elementalTuning",
      discardedCard: cardId
    });
  }
  results.push({
    type: "declareEnd",
  });
  return {
    candidates: results,
  };
}

type NontrivialActionResponse = SwitchActiveActionResponse | UseSkillActionResponse | PlayCardActionResponse;

export function checkRpcResponse(actions: ActionConfig[], response: NontrivialActionResponse): ActionConfig | null {
  switch (response.type) {
    case "switchActive": {
      const cfg = actions.find(c => c.type === "switchActive" && c.to.entityId === response.active);
      return cfg ?? null;
    }
    case "useSkill": {
      const cfg = actions.find(c => c.type === "useSkill" && c.skill.info.id === response.skill);
      return cfg ?? null;
    }
    case "playCard": {
      // targets 是按顺序推入 request 的 targets 字段的，故返回的 targetIndex 反映了 filter 之后的索引
      const cfgs = actions.filter(c => c.type === "playCard" && c.card.entityId === response.card);
      if (cfgs.length < response.targetIndex || response.targetIndex < 0) return null;
      return cfgs[response.targetIndex];
    }
  }
}
