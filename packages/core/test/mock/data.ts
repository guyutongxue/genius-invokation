import { SkillDefinition } from "@/base/skill";
import { ReadonlyDataStore } from "@/builder";
import { CharacterDefinition } from "@/base/character";
import { Draft, produce } from "immer";
import { GameIO } from "@/io";
import { Game } from "@/game";
import { GameConfig } from "@/base/state";
import { CardDefinition } from "@/base/card";

export let mockedSkills: SkillDefinition[] = [];
export let mockedCharacters: CharacterDefinition[] = [];
export let mockedCards: CardDefinition[] = [];
let mocking = false;

export function isMocking() {
  return mocking;
}

function extendData(exists: ReadonlyDataStore): ReadonlyDataStore {
  return produce(exists, (draft) => {
    for (const skill of mockedSkills) {
      draft.skill.set(skill.id, skill as Draft<SkillDefinition>);
    }
    for (const character of mockedCharacters) {
      draft.character.set(character.id, character as Draft<CharacterDefinition>);
    }
  });
}

function mockIo(): GameIO {}


function mockGame(data: ReadonlyDataStore) {
  const config: GameConfig = {

  }
  const game = new Game(extendData(data), config, , mockIo);
}
