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

import { test, expect } from "bun:test";
import { shuffle, sortDice } from "../utils";
import { Aura, DiceType } from "@gi-tcg/typings";
import { PlayerState } from "..";

test("sort dice", () => {
  const dice = [
    DiceType.Omni,
    DiceType.Electro,
    DiceType.Electro,
    DiceType.Dendro,
    DiceType.Pyro,
    DiceType.Pyro,
    DiceType.Cryo,
    DiceType.Hydro,
    DiceType.Anemo,
  ];
  const shuffled = shuffle(dice);
  // 草和雷是出战角色的骰子（有效骰）
  const playerState: PlayerState = {
    activeCharacterId: -1,
    characters: [
      {
        id: -1,
        damageLog: [],
        entities: [],
        variables: {} as never,
        definition: {
          __definition: "characters",
          id: 1601,
          initiativeSkills: [],
          skills: [],
          tags: ["dendro"],
          type: "character",
          varConfigs: {} as never,
          version: {
            predicate: "until",
            version: "v3.3.0"
          }
        }
      },
      {
        id: -2,
        damageLog: [],
        entities: [],
        variables: {} as never,
        definition: {
          __definition: "characters",
          id: 1401,
          initiativeSkills: [],
          skills: [],
          tags: ["electro"],
          type: "character",
          varConfigs: {} as never,
          version: {
            predicate: "until",
            version: "v3.3.0"
          }
        }
      }
    ],
    hands: [],
    piles: [],
    initialPiles: [],
    dice: shuffled,
    summons: [],
    supports: [],
    combatStatuses: [],
    canCharged: false,
    canPlunging: false,
    declaredEnd: false,
    skipNextTurn: false,
    hasDefeated: false,
    legendUsed: false,
    roundSkillLog: new Map(),
  };
  const sorted = sortDice(playerState, shuffled);
  expect(sorted).toEqual(dice);
})