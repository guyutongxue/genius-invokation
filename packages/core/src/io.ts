// Copyright (C) 2024 Guyutongxue
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

import {
  Action,
  CardData,
  CharacterData,
  EntityData,
  ExposedMutation,
  NotificationMessage,
  PlayerData,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  SkillData,
  StateData,
} from "@gi-tcg/typings";
import {
  CardState,
  CharacterState,
  EntityState,
  GameState,
} from "./base/state";
import { Mutation } from "./base/mutation";
import { ActionInfo, InitiativeSkillDefinition } from "./base/skill";
import { GiTcgIOError } from "./error";
import { USAGE_PER_ROUND_VARIABLE_NAMES } from "./base/entity";
import { initiativeSkillsOfPlayer } from "./utils";

export interface PlayerIO {
  giveUp: boolean;
  readonly notify: (notification: NotificationMessage) => void;
  readonly rpc: <M extends RpcMethod>(
    method: M,
    data: RpcRequest[M],
  ) => Promise<RpcResponse[M]>;
}

export interface GameIO {
  readonly pause?: (
    state: GameState,
    mutations: Mutation[],
    canResume: boolean,
  ) => Promise<unknown>;
  readonly onIoError?: (e: GiTcgIOError) => void;
  readonly players: readonly [PlayerIO, PlayerIO];
}

export function exposeMutation(
  who: 0 | 1,
  m: Mutation,
): ExposedMutation | null {
  switch (m.type) {
    case "stepRandom":
    case "mutateExtensionState":
    case "pushRoundSkillLog":
    case "clearRoundSkillLog":
    case "switchActive": // We will manually handle this
      return null;
    case "changePhase":
      return m;
    case "stepRound":
      return m;
    case "switchTurn":
      return m;
    case "setWinner":
      return m;
    case "transferCard": {
      return {
        type: "transferCard",
        who: m.who,
        from: m.from,
        to: m.to,
        id: m.value.id,
        definitionId: m.who === who ? m.value.definition.id : 0,
      };
    }
    case "removeCard": {
      const hide = m.who !== who && ["overflow", "elementalTuning"].includes(m.reason);
      return {
        type: "removeCard",
        who: m.who,
        where: m.where,
        reason: m.reason,
        id: m.oldState.id,
        definitionId: hide ? 0 : m.oldState.definition.id,
      };
    }
    case "createCard": {
      return {
        type: "createCard",
        who: m.who,
        id: m.target === "hands" ? m.value.id : 0,
        definitionId: m.who === who ? m.value.definition.id : 0,
        target: m.target,
      };
    }
    case "createCharacter": {
      return {
        type: "createCharacter",
        who: m.who,
        id: m.value.id,
        definitionId: m.value.definition.id,
      };
    }
    case "createEntity": {
      return {
        type: "createEntity",
        id: m.value.id,
        definitionId: m.value.definition.id,
      };
    }
    case "removeEntity": {
      return {
        type: "removeEntity",
        id: m.oldState.id,
        definitionId: m.oldState.definition.id,
      };
    }
    case "modifyEntityVar": {
      return {
        type: "modifyEntityVar",
        id: m.state.id,
        definitionId: m.state.definition.id,
        varName: m.varName,
        value: m.value,
      };
    }
    case "transformDefinition": {
      return {
        type: "transformDefinition",
        id: m.state.id,
        newDefinitionId: m.newDefinition.id,
      };
    }
    case "resetDice": {
      return {
        type: "resetDice",
        who: m.who,
        value: m.who === who ? m.value : [...m.value].fill(0),
      };
    }
    case "setPlayerFlag": {
      if (["declaredEnd", "legendUsed"].includes(m.flagName)) {
        return {
          type: "setPlayerFlag",
          who: m.who,
          flagName: m.flagName as any,
          value: m.value,
        };
      } else {
        return null;
      }
    }
    default: {
      const _check: never = m;
      return null;
    }
  }
}

function exposeEntity(state: GameState, e: EntityState): EntityData {
  let equipment: EntityData["equipment"];
  if (e.definition.type === "equipment") {
    if (e.definition.tags.includes("artifact")) {
      equipment = "artifact";
    } else if (e.definition.tags.includes("weapon")) {
      equipment = "weapon";
    } else if (e.definition.tags.includes("technique")) {
      equipment = "technique";
    } else {
      equipment = true;
    }
  } else {
    equipment = false;
  }
  const descriptionDictionary = Object.fromEntries(
    Object.entries(e.definition.descriptionDictionary).map(([k, v]) => [
      k,
      v(state, e.id),
    ]),
  );
  const usagePerRoundHighlight = USAGE_PER_ROUND_VARIABLE_NAMES.some(
    (name) => e.variables[name],
  );
  return {
    id: e.id,
    definitionId: e.id === 0 ? 0 : e.definition.id,
    variable: e.definition.visibleVarName
      ? e.variables[e.definition.visibleVarName] ?? null
      : null,
    usagePerRoundHighlight,
    hintIcon: e.variables.hintIcon ?? null,
    hintText: e.definition.hintText,
    equipment,
    descriptionDictionary,
  };
}

function exposeCard(state: GameState, c: CardState, hide: boolean): CardData {
  if (c.id === 0) {
    hide = true;
  }
  const descriptionDictionary = hide
    ? {}
    : Object.fromEntries(
        Object.entries(c.definition.descriptionDictionary).map(([k, v]) => [
          k,
          v(state, c.id),
        ]),
      );
  return {
    id: c.id,
    descriptionDictionary,
    isLegend: !hide && c.definition.tags.includes("legend"),
    definitionId: hide ? 0 : c.definition.id,
    definitionCost: hide ? [] : [...c.definition.requiredCost],
  };
}

function exposeCharacter(state: GameState, ch: CharacterState): CharacterData {
  return {
    id: ch.id,
    definitionId: ch.definition.id,
    defeated: !ch.variables.alive,
    entities: ch.entities.map((e) => exposeEntity(state, e)),
    health: ch.variables.health,
    energy: ch.variables.energy,
    maxHealth: ch.variables.maxHealth,
    maxEnergy: ch.variables.maxEnergy,
    aura: ch.variables.aura,
  };
}

function exposeInitiativeSkill(skill: InitiativeSkillDefinition): SkillData {
  return {
    definitionId: skill.id,
    definitionCost: [...skill.requiredCost],
  };
}

export function exposeState(who: 0 | 1, state: GameState): StateData {
  return {
    phase: state.phase,
    currentTurn: state.currentTurn,
    roundNumber: state.roundNumber,
    winner: state.winner,
    players: state.players.map<PlayerData>((p, i) => {
      const skills = initiativeSkillsOfPlayer(p).map(
        ({ definition }) => definition,
      );
      return {
        activeCharacterId: p.activeCharacterId,
        piles: p.piles.map((c) => exposeCard(state, c, true)),
        hands: p.hands.map((c) => exposeCard(state, c, i !== who)),
        characters: p.characters.map((ch) => exposeCharacter(state, ch)),
        dice: i === who ? [...p.dice] : [...p.dice].fill(0),
        combatStatuses: p.combatStatuses.map((e) => exposeEntity(state, e)),
        supports: p.supports.map((e) => exposeEntity(state, e)),
        summons: p.summons.map((e) => exposeEntity(state, e)),
        skills: i === who ? skills.map(exposeInitiativeSkill) : [],
        declaredEnd: p.declaredEnd,
        legendUsed: p.legendUsed,
      };
    }) as [PlayerData, PlayerData],
  };
}

export function exposeAction(action: ActionInfo): Action {
  switch (action.type) {
    case "useSkill": {
      return {
        type: "useSkill",
        skill: action.skill.definition.id,
        cost: action.cost,
        targets: action.targets.map((t) => t.id),
        preview: action.preview
          ? exposeState(action.who, action.preview)
          : void 0,
      };
    }
    case "playCard": {
      return {
        type: "playCard",
        card: action.card.id,
        cost: action.cost,
        targets: action.targets.map((t) => t.id),
        preview: action.preview
          ? exposeState(action.who, action.preview)
          : void 0,
      };
    }
    case "switchActive":
      return {
        type: "switchActive",
        active: action.to.id,
        cost: action.cost,
      };
    case "elementalTuning":
      return {
        type: "elementalTuning",
        discardedCard: action.card.id,
        target: action.result,
      };
    case "declareEnd": {
      return {
        type: "declareEnd",
      };
    }
  }
}
