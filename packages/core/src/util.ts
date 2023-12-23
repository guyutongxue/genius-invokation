import { Draft } from "immer";
import minstd from "@stdlib/random-base-minstd";
import { DiceType } from "@gi-tcg/typings";

import {
  CharacterState,
  EntityState,
  GameState,
  IteratorState,
  PlayerState,
} from "./base/state";
import { EntityArea } from "./base/entity";
import { CharacterDefinition, ElementTag } from "./base/character";
import { flip } from "@gi-tcg/utils";
import { CardTag } from "./base/card";
import { applyMutation } from "./base/mutation";

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
  throw new Error(`Cannot found such entity`);
}

/**
 * 查找所有实体，按照通常响应顺序排序
 * @param state 游戏状态
 * @returns 实体状态列表
 */
export function allEntities(
  state: GameState,
): (CharacterState | EntityState)[] {
  const result: (CharacterState | EntityState)[] = [];
  for (const who of [state.currentTurn, flip(state.currentTurn)]) {
    const player = state.players[who];
    const activeIdx = getActiveCharacterIndex(player);
    for (const ch of shiftLeft(player.characters, activeIdx)) {
      result.push(ch);
      result.push(...ch.entities);
    }
    for (const key of ["combatStatuses", "summons", "supports"] as const) {
      result.push(...player[key]);
    }
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
  throw new Error(`Cannot found such entity`);
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
      throw new Error(`Cannot found such entity`);
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
  throw new Error(`Cannot found such entity`);
}

export function getActiveCharacterIndex(player: PlayerState): number {
  const activeIdx = player.characters.findIndex(
    (ch) => ch.id === player.activeCharacterId,
  );
  if (activeIdx === -1) {
    throw new Error("Invalid active character index");
  }
  return activeIdx;
}

export function nextRandom(
  oldState: IteratorState,
): readonly [number, IteratorState] {
  const factory = minstd.factory({
    state: oldState.random,
  });
  // [1, 2147483646]
  const randInt = factory();
  return [
    randInt,
    {
      random: factory.state,
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
  const characterElements = shiftLeft(
    player.characters,
    getActiveCharacterIndex(player),
  ).map((ch) => elementOfCharacter(ch.definition));
  const value = (d: DiceType) => {
    if (d === DiceType.Omni) return -1000;
    const idx = characterElements.indexOf(d);
    if (idx !== -1) return -100 + idx;
    return d as number;
  };
  return [...dice].sort((a, b) => value(a) - value(b));
}

export function shiftLeft<T>(arr: readonly T[], idx: number): T[] {
  return [...arr.slice(idx), ...arr.slice(0, idx)];
}

// Shuffle an array. No use of state random generator
export function shuffle<T>(arr: readonly T[]): readonly T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
