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
  PlayCardHint,
  PlayerData,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  SkillData,
  StateData,
} from "@gi-tcg/typings";
import { CardState, CharacterState, EntityState, GameState } from "./base/state";
import { Mutation } from "./base/mutation";
import { ActionInfo, InitiativeSkillDefinition } from "./base/skill";
import { GiTcgIOError } from "./error";

export interface PlayerIO {
  giveUp: boolean;
  readonly notify: (notification: NotificationMessage) => void;
  readonly rpc: <M extends RpcMethod>(
    method: M,
    data: RpcRequest[M],
  ) => Promise<RpcResponse[M]>;
}

export interface GameIO {
  readonly pause?: (state: GameState, mutations: ExposedMutation[]) => Promise<unknown>;
  readonly onIoError?: (e: GiTcgIOError) => void;
  readonly players: readonly [PlayerIO, PlayerIO];
}

export function exposeMutation(
  who: 0 | 1,
  m: Mutation,
): ExposedMutation | null {
  switch (m.type) {
    case "stepRandom":
    case "clearMutationLog":
    case "pushActionLog":
    // case "pushDamageLog":
    case "increaseDisposedSupportCount":
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
        path: m.path,
        who: m.who,
        id: m.value.id,
        definitionId: m.who === who ? Math.floor(m.value.definition.id) : 0,
      };
    }
    case "switchActive": {
      return {
        type: "switchActive",
        who: m.who,
        id: m.value.id,
        definitionId: Math.floor(m.value.definition.id),
      };
    }
    case "disposeCard": {
      return {
        type: "disposeCard",
        who: m.who,
        used: m.used,
        id: m.oldState.id,
        definitionId: Math.floor(m.oldState.definition.id),
      };
    }
    case "createCard": {
      return {
        type: "createCard",
        who: m.who,
        id: m.value.id,
        definitionId:
          m.who === who && m.target === "hands"
            ? Math.floor(m.value.definition.id)
            : 0,
        target: m.target,
      };
    }
    case "createCharacter": {
      return {
        type: "createCharacter",
        who: m.who,
        id: m.value.id,
        definitionId: Math.floor(m.value.definition.id),
      };
    }
    case "createEntity": {
      return {
        type: "createEntity",
        id: m.value.id,
        definitionId: Math.floor(m.value.definition.id),
      };
    }
    case "disposeEntity": {
      return {
        type: "disposeEntity",
        id: m.oldState.id,
        definitionId: Math.floor(m.oldState.definition.id),
      };
    }
    case "modifyEntityVar": {
      return {
        type: "modifyEntityVar",
        id: m.state.id,
        definitionId: Math.floor(m.state.definition.id),
        varName: m.varName,
        value: m.value,
      };
    }
    case "replaceCharacterDefinition": {
      return {
        type: "replaceCharacterDefinition",
        id: m.state.id,
        newDefinitionId: Math.floor(m.newDefinition.id),
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
      if (["declareEnd", "legendUsed"].includes(m.flagName)) {
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

function exposeEntity(e: EntityState): EntityData {
  let equipment: boolean | "weapon" | "artifact";
  if (e.definition.type === "equipment") {
    if (e.definition.tags.includes("artifact")) {
      equipment = "artifact";
    } else if (e.definition.tags.includes("weapon")) {
      equipment = "weapon";
    } else {
      equipment = true;
    }
  } else {
    equipment = false;
  }
  return {
    id: e.id,
    definitionId: Math.floor(e.definition.id),
    variable: e.definition.visibleVarName
      ? e.variables[e.definition.visibleVarName] ?? null
      : null,
    hintIcon: e.variables.hintIcon ?? null,
    hintText: e.definition.hintText,
    equipment,
  };
}

function exposeCard(c: CardState, hide: boolean): CardData {
  return {
    id: c.id,
    definitionId: hide ? 0 : Math.floor(c.definition.id),
    definitionCost: hide ? [] : [...c.definition.skillDefinition.requiredCost],
  };
}

function exposeCharacter(ch: CharacterState): CharacterData {
  return {
    id: ch.id,
    definitionId: Math.floor(ch.definition.id),
    defeated: !ch.variables.alive,
    entities: ch.entities.map(exposeEntity),
    health: ch.variables.health,
    energy: ch.variables.energy,
    maxEnergy: ch.variables.maxEnergy,
    aura: ch.variables.aura,
  };
}

function exposeInitiativeSkill(skill: InitiativeSkillDefinition): SkillData {
  return {
    definitionId: Math.floor(skill.id),
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
      const skills =
        p.characters.find((ch) => p.activeCharacterId === ch.id)?.definition
          .initiativeSkills ?? [];
      return {
        activeCharacterId: p.activeCharacterId,
        piles: p.piles.map((c) => exposeCard(c, true)),
        hands: p.hands.map((c) => exposeCard(c, i !== who)),
        characters: p.characters.map(exposeCharacter),
        dice: i === who ? [...p.dice] : [...p.dice].fill(0),
        combatStatuses: p.combatStatuses.map(exposeEntity),
        supports: p.supports.map(exposeEntity),
        summons: p.summons.map(exposeEntity),
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
        skill: Math.floor(action.skill.definition.id),
        cost: action.cost,
        preview: exposeState(action.who, action.preview),
      };
    }
    case "playCard": {
      return {
        type: "playCard",
        card: action.card.id,
        cost: action.cost,
        // We can provide more detail hint here
        hints: [PlayCardHint.GeneralTarget, PlayCardHint.GeneralTarget2],
        targets: action.targets.map((t) => t.id),
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
