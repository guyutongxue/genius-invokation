import { Player, createGame } from "@jenshin-tcg/core";


const player0: Player = {
  id: "A",
  characters: [0, 1, 2],
  piles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};
const player1: Player = {
  id: "B",
  characters: [3, 4, 5],
  piles: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
};

const [o0, o1] = createGame({
  pvp: true,
  players: [player0, player1],
});

