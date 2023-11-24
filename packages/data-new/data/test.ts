import { character, skill, DamageType, card } from "@gi-tcg";
import { getCardDefinition, getCharacterDefinition, getSkillDefinition } from "../src/registry";
import { GameState, PlayerState } from "../src/state";
import { InitiativeSkillDefinition } from "../src/skill";

const TestSkill = skill(10011)
  .damage(1, DamageType.Piercing, $ => $.opp().standby())
  .damage(3, DamageType.Cryo)
  .heal(1, $ => $.self())
  // .if((c) => {
  //   c.query("character").one();
  // })
  .done();

// const TestSkill = skill(10012)
//   .apply(DamageType.Hydro, $ => $.self())
//   .done();
const TestCard = card(20011, ["character"])
  .costVoid(2)
  .heal(1, $ => $.context.targets[0])
  .done();

// const TestStatus = status(114053)
//   .duration(2)
//   .on("useSkill")
//   .if((c) => c.definition.type === "normal")
//   .damage(1, DamageType.Electro)
//   .on("beforeDamaged")
//   .if((c) => c.value >= 3)
//   .decreaseDamage(1)
//   .done()

// const TestStatus2 = status(123456)
//   .variable("testVar", 0)
//   .on("useSkill")
//   .damage(1, DamageType.Piercing, $ => $.self().master())
//   .if((c) => c.definition.type === "burst")
//   .do((c) => c.variables.testVar += 1)
//   .done()

const TestCharacter = character(1001)
  .tags("cryo", "mondstadt", "sword")
  .skills(TestSkill)
  .done();

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
          {
            id: -102,
            definition: ch,
            entities: [],
            variables: ch.constants,
            defeated: false,
          },
          {
            id: -103,
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
  const skillDef = getSkillDefinition(TestSkill) as InitiativeSkillDefinition;
  const [newState, events] = await skillDef.action(initGameState, -100);
  const cardDef = getCardDefinition(TestCard);
  const [newState2, events2] = await cardDef.skillDefinition.action(newState, -101, { ids: [-102] });
  // console.log({ newState, events });
  console.log("ff")
}

test();
