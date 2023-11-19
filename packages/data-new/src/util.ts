import { Draft } from "immer";
import { CharacterState, EntityState, GameState } from "./state";

export function getEntityById(state: GameState, id: number, includeCharacter: false): EntityState;
export function getEntityById(state: GameState, id: number, includeCharacter: true): EntityState | CharacterState;
export function getEntityById(state: GameState, id: number, includeCharacter = false): EntityState | CharacterState {
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
