import { SkillDefinition } from "../../base/skill";
import { ReadonlyDataStore } from "../../builder";
import { CharacterDefinition } from "../../base/character";
import { Draft, produce } from "immer";
import { GameIO } from "../../io";
import { Game } from "../../game";
import { GameConfig } from "../../base/state";
import { CardDefinition } from "../../base/card";

function mockIo(): GameIO {}

function mockGame(data: ReadonlyDataStore) {
  const config: GameConfig = {

  }
  const game = new Game(extendData(data), config, , mockIo);
}
