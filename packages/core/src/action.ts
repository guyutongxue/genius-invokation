import { CharacterPath } from "./character.js";
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
import * as _ from "lodash-es";
import { CardPath, EntityPath, PlayerEntityPath, SkillPath } from "./entity.js";
import {
  GameState,
  Store,
  findCharacter,
  findEntity,
  getCharacterAtPath,
} from "./store.js";
import { CardTargetDescriptor } from "@gi-tcg/data";
import { PlayCardContextImpl } from "./context.js";

export type UseSkillConfig = {
  type: "useSkill";
  dice: DiceType[];
  skill: SkillPath;
};

export type PlayCardTargetPath = PlayerEntityPath | CharacterPath;

export type PlayCardConfig = {
  type: "playCard";
  dice: DiceType[];
  card: CardPath;
  targets: PlayCardTargetPath[];
};

export type SwitchActiveConfig = {
  type: "switchActive";
  dice: DiceType[];
  from: CharacterPath;
  to: CharacterPath;
  fast: boolean;
};

export type ElementalTuningActionConfig = {
  type: "elementalTuning";
  card: CardPath;
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

function getCardTarget(
  state: GameState,
  descriptor: CardTargetDescriptor,
): PlayCardTargetPath[][] {
  if (descriptor.length === 0) {
    return [[]];
  }
  const [first, ...rest] = descriptor;
  let firstResult: PlayCardTargetPath[] = [];
  switch (first) {
    case "character": {
      firstResult = findCharacter(state, "all").map(([, chPath]) => chPath);
      break;
    }
    case "summon": {
      const c0 = findEntity(state, 0, "summon").map(([, path]) => path);
      const c1 = findEntity(state, 1, "summon").map(([, path]) => path);
      firstResult = [...c0, ...c1] as PlayerEntityPath[];
      break;
    }
  }
  return firstResult.flatMap((c) =>
    getCardTarget(state, rest).map((r) => [c, ...r]),
  );
}

export function getCardActions(state: GameState, who: 0 | 1): PlayCardConfig[] {
  const player = state.players[who];
  const actions: PlayCardConfig[] = [];
  for (const hand of player.hands) {
    const path: CardPath = {
      type: "card",
      who: who,
      entityId: hand.entityId,
      info: hand.info,
    };
    const currentEnergy = getCharacterAtPath(state, player.active!).energy;
    const costEnergy = hand.info.costs.filter(
      (c) => c === DiceType.Energy,
    ).length;
    if (currentEnergy < costEnergy) {
      continue;
    }
    const targets = getCardTarget(state, hand.info.target);
    for (const t of targets) {
      const store = Store.fromState(state);
      const ctx = new PlayCardContextImpl(store, path, path.who, path, t);
      if (ctx.enabled()) {
        actions.push({
          type: "playCard",
          dice: [...hand.info.costs],
          card: path,
          targets: t,
        });
      }
    }
  }
  return actions;
}

export async function rpcAction(
  actions: ActionConfig[],
  req2rep: (r: ActionRequest) => Promise<ActionResponse>,
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
          discardedCard: action.card.entityId,
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
          })),
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
      cfg = actions.find(
        (c) =>
          c.type === "elementalTuning" &&
          c.card.entityId === response.discardedCard,
      );
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
        (c) => c.type === "switchActive" && c.to.entityId === response.active,
      );
      break;
    }
    case "useSkill": {
      cfg = actions.find(
        (c) => c.type === "useSkill" && c.skill.info.id === response.skill,
      );
      break;
    }
    case "playCard": {
      const reqItem = candidates.find(
        (c): c is PlayCardAction =>
          c.type === "playCard" && c.card === response.card,
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
            reqTargets[resTargetIndex].map((t) => t.entityId),
          ),
      );
    }
  }
  if (typeof cfg === "undefined") {
    throw new Error(`Response action could not be found`);
  }
  return {
    ...cfg,
    consumedDice: "dice" in response ? response.dice : [],
  };
}

export type NontrivialActionResponse =
  | SwitchActiveActionResponse
  | UseSkillActionResponse
  | PlayCardActionResponse;
