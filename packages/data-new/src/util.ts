import { CharacterState, EntityState, GameState } from "./state";

export function getEntityById(state: GameState, id: number): CharacterState | EntityState {
  for (const player of state.players) {
    for (const ch of player.characters) {
      if (ch.id === id) {
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
