const ENTITY_ID_BEGIN = 5.6e7;
let nextEntityId = ENTITY_ID_BEGIN;

export function newEntityId(): number {
  return nextEntityId++;
}
