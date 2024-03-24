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

import { Draft } from "immer";
import type { U } from "ts-toolbelt";
import minstd from "@stdlib/random-base-minstd";
import { DiceType } from "@gi-tcg/typings";
import { flip } from "@gi-tcg/utils";
import {
  CharacterState,
  EntityState,
  GameState,
  IteratorState,
  PlayerState,
} from "./base/state";
import { EntityArea, EntityVariable, Variable } from "./base/entity";
import {
  CharacterDefinition,
  CharacterVariable,
  ElementTag,
} from "./base/character";
import { CardTag } from "./base/card";
import { applyMutation } from "./base/mutation";
import { SkillDefinition, SkillInfo } from "./base/skill";
import {
  GiTcgCoreInternalEntityNotFoundError,
  GiTcgCoreInternalError,
} from "./error";

export function getEntityById(
  state: GameState,
  id: number,
  includeCharacter?: false,
): EntityState;
export function getEntityById(
  state: GameState,
  id: number,
  includeCharacter: true,
): EntityState | CharacterState;
export function getEntityById(
  state: GameState,
  id: number,
  includeCharacter = false,
): EntityState | CharacterState {
  for (const player of state.players) {
    for (const ch of player.characters) {
      if (includeCharacter && ch.id === id) {
        return ch;
      }
      for (const entity of ch.entities) {
        if (entity.id === id) {
          return entity;
        }
      }
    }
    for (const key of ["combatStatuses", "summons", "supports"] as const) {
      const area = player[key];
      for (const entity of area) {
        if (entity.id === id) {
          return entity;
        }
      }
    }
  }
  throw new GiTcgCoreInternalError(`Cannot found entity ${id}`);
}

type WrapNever<T, Fallback> = T extends never ? Fallback : T;
type VariableValueT<V extends Variable, N extends string> = WrapNever<
  U.Select<V, { name: N }>["value"],
  number
>;

type A = (readonly EntityVariable[])[number];
type X = VariableValueT<A, "d">;

export function getVariable<T extends readonly Variable[], Name extends string>(
  et: { variables: T },
  name: Name,
): VariableValueT<T[number], Name> {
  const variable = et.variables.find((v) => v.name === name);
  if (typeof variable === "undefined") {
    throw new GiTcgCoreInternalError(`Cannot found variable ${name}`);
  }
  return variable.value as VariableValueT<T[number], Name>;
}

/**
 * 查找所有实体，按照通常响应顺序排序
 * @param state 游戏状态
 * @returns 实体状态列表
 */
export function allEntities(
  state: GameState,
  excludeDefeated = false,
): (CharacterState | EntityState)[] {
  const result: (CharacterState | EntityState)[] = [];
  for (const who of [state.currentTurn, flip(state.currentTurn)]) {
    const player = state.players[who];
    const activeIdx = getActiveCharacterIndex(player);
    // 根据一些测试表明，游戏实际的响应顺序并非规则书所述，而是
    // 出战角色、出战角色装备和状态、出战状态、后台角色、后台角色装备和状态
    // 召唤物、支援牌
    // （即出战状态区夹在出战角色区和后台角色区之间）
    const [active, ...standby] = player.characters.shiftLeft(activeIdx);
    if (!excludeDefeated || getVariable(active, "health") > 0) {
      result.push(active, ...active.entities);
    }
    result.push(...player.combatStatuses);
    for (const ch of standby) {
      if (!excludeDefeated || getVariable(ch, "health") > 0) {
        result.push(ch, ...ch.entities);
      }
    }
    result.push(...player.summons, ...player.supports);
  }
  return result;
}

export function getEntityArea(state: GameState, id: number): EntityArea {
  for (const who of [0, 1] as const) {
    const player = state.players[who];
    for (const ch of player.characters) {
      if (ch.id === id || ch.entities.find((e) => e.id === id)) {
        return {
          type: "characters",
          who,
          characterId: ch.id,
        };
      }
    }
    for (const key of ["combatStatuses", "summons", "supports"] as const) {
      if (player[key].find((e) => e.id === id)) {
        return {
          type: key,
          who,
        };
      }
    }
  }
  throw new GiTcgCoreInternalEntityNotFoundError(state, id);
}

export function allEntitiesAtArea(
  state: GameState,
  area: EntityArea,
): (CharacterState | EntityState)[] {
  const result: (CharacterState | EntityState)[] = [];
  const player = state.players[area.who];
  if (area.type === "characters") {
    const characters = player.characters;
    const idx = characters.findIndex((ch) => ch.id === area.characterId);
    if (idx === -1) {
      throw new GiTcgCoreInternalEntityNotFoundError(state, area.characterId);
    }
    result.push(characters[idx]);
    result.push(...characters[idx].entities);
  } else {
    result.push(...player[area.type]);
  }
  return result;
}

export function disposeEntity(state: Draft<GameState>, id: number) {
  for (const player of state.players) {
    for (const ch of player.characters) {
      const idx = ch.entities.findIndex((e) => e.id === id);
      if (idx !== -1) {
        ch.entities.splice(idx, 1);
        return;
      }
    }
    for (const key of ["combatStatuses", "summons", "supports"] as const) {
      const area = player[key];
      const idx = area.findIndex((e) => e.id === id);
      if (idx !== -1) {
        area.splice(idx, 1);
        return;
      }
    }
  }
  throw new GiTcgCoreInternalEntityNotFoundError(state, id);
}

export function getActiveCharacterIndex(player: PlayerState): number {
  const activeIdx = player.characters.findIndex(
    (ch) => ch.id === player.activeCharacterId,
  );
  if (activeIdx === -1) {
    throw new GiTcgCoreInternalError(
      `Invalid active character id ${player.activeCharacterId}`,
    );
  }
  return activeIdx;
}

export interface CheckPreparingResult {
  status: EntityState;
  skillId: number;
}

export function findReplaceAction(character: CharacterState): SkillInfo | null {
  const candidates = character.entities
    .map(
      (st) =>
        [
          st,
          st.definition.skills.find((sk) => sk.triggerOn === "replaceAction"),
        ] as const,
    )
    .filter(([st, sk]) => sk);
  if (candidates.length === 0) {
    return null;
  }
  const [caller, definition] = candidates[0];
  return {
    caller,
    definition: definition as SkillDefinition,
    requestBy: null,
    fromCard: null,
    charged: false,
    plunging: false,
  };
}

export function isSkillDisabled(character: CharacterState): boolean {
  return character.entities.some((st) =>
    st.definition.tags.includes("disableSkill"),
  );
}

export function nextRandom(
  oldState: IteratorState,
): readonly [number, IteratorState] {
  const factory = minstd.factory({
    state: new Int32Array(oldState.random),
  });
  // [1, 2147483646]
  const randInt = factory();
  return [
    randInt,
    {
      random: [...factory.state],
      id: oldState.id,
    },
  ];
}

export function drawCard(
  state: GameState,
  who: 0 | 1,
  withTag: CardTag | null,
): GameState {
  let candidate;
  if (withTag !== null) {
    candidate =
      state.players[who].piles.find((c) =>
        c.definition.tags.includes(withTag),
      ) ?? state.players[who].piles[0];
  } else {
    candidate = state.players[who].piles[0];
  }
  if (typeof candidate === "undefined") {
    return state;
  }

  state = applyMutation(state, {
    type: "transferCard",
    path: "pilesToHands",
    who,
    value: candidate,
  });
  if (state.players[who].hands.length > state.config.maxHands) {
    state = applyMutation(state, {
      type: "disposeCard",
      who,
      oldState: candidate,
      used: false,
    });
  }
  return state;
}

export function elementOfCharacter(ch: CharacterDefinition): DiceType {
  const elementTags: Record<ElementTag, DiceType> = {
    cryo: DiceType.Cryo,
    hydro: DiceType.Hydro,
    pyro: DiceType.Pyro,
    electro: DiceType.Electro,
    anemo: DiceType.Anemo,
    geo: DiceType.Geo,
    dendro: DiceType.Dendro,
  };
  const element = ch.tags.find((tag): tag is ElementTag => tag in elementTags);
  if (typeof element === "undefined") {
    return DiceType.Void;
  }
  return elementTags[element];
}

export function sortDice(
  player: PlayerState,
  dice: readonly DiceType[],
): DiceType[] {
  const characterElements = player.characters
    .shiftLeft(getActiveCharacterIndex(player))
    .map((ch) => elementOfCharacter(ch.definition));
  const value = (d: DiceType) => {
    if (d === DiceType.Omni) return -1000;
    const idx = characterElements.indexOf(d);
    if (idx !== -1) return -100 + idx;
    return d as number;
  };
  return dice.toSorted((a, b) => value(a) - value(b));
}

declare global {
  interface ReadonlyArray<T> {
    shiftLeft: typeof shiftLeft;
    last: typeof arrayLast;
  }
  interface Array<T> {
    /** Won't mutate original array. */
    shiftLeft: typeof shiftLeft;
    last: typeof arrayLast;
  }
}

function shiftLeft<T>(this: readonly T[], idx: number): T[] {
  return [...this.slice(idx), ...this.slice(0, idx)];
}
function arrayLast<T>(this: readonly T[]): T {
  return this[this.length - 1];
}
Array.prototype.shiftLeft = shiftLeft;
Array.prototype.last = arrayLast;

// Shuffle an array. No use of state random generator
export function shuffle<T>(arr: readonly T[]): readonly T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
