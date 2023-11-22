import { character, skill, DamageType } from "@gi-tcg";
import { getCharacterDefinition, getSkillDefinition } from "../src/registry";
import { GameState, PlayerState } from "../src/state";

const TestSkill = skill(10011)
  .do((c) => {
    c.damage(1, DamageType.Physical);
    // c.damage(1, DamageType.Piercing, $ => $.opp().standby());
  })
  .build();

const TestCharacter = character(1001)
  .tags("cryo", "mondstadt", "sword")
  .skills(TestSkill)
  .build();

async function test() {
  const ch = getCharacterDefinition(TestCharacter);
  const initGameState: GameState = {
    config: {
      initialDice: 8,
      initialHands: 5,
      maxDice: 16,
      maxHands: 10,
      maxRounds: 15,
      maxSummons: 4,
      maxSupports: 4,
    },
    phase: "action",
    currentTurn: 0,
    roundNumber: 0,
    skillLog: [],
    mutationLog: [],
    winner: null,
    players: [
      {
        activeCharacterId: -100,
        characters: [
          {
            id: -100,
            definition: ch,
            entities: [],
            variables: ch.constants,
            defeated: false,
          },
        ],
        piles: [],
        hands: [],
        dice: [],
        combatStatuses: [],
        declaredEnd: false,
        legendUsed: false,
        skipNextTurn: false,
        summons: [],
        supports: [],
      },
      {
        activeCharacterId: -101,
        characters: [
          {
            id: -101,
            definition: ch,
            entities: [],
            variables: ch.constants,
            defeated: false,
          },
        ],
        piles: [],
        hands: [],
        dice: [],
        combatStatuses: [],
        declaredEnd: false,
        legendUsed: false,
        skipNextTurn: false,
        summons: [],
        supports: [],
      },
    ],
  };
  const skillDef = getSkillDefinition(TestSkill);
  const [newState, events] = await skillDef.action(initGameState, -100);
  console.log({ newState, events });
}

test();
