import { Player, createGame } from "@jenshin-tcg/core";
import { MethodNames, RequestType, ResponseType } from "@jenshin-tcg/typings";

async function handle(
  this: Player,
  method: MethodNames,
  req: unknown
): Promise<unknown> {
  switch (method) {
    case "initialize": {
      // const r = req as RequestType<"initialize">;
      // console.log(this, req);
      return { success: true };
    }
    case "switchHands": {
      const r = req as RequestType<typeof method>;
      console.log(this, req);
      if (r.canRemove) {
        return { removedHands: [0, 1, 2] };
      } else {
        return { removedHands: [] };
      }
    }
    case "eventArrived": {
      const r = req as RequestType<typeof method>;
      switch (r.event.type) {
        case "updateState": {
          const { state } = r.event;
          if (this.id === "A")
          console.log(state);
        }
      }
      return { success: true };
    }
    default:
      return { success: false };
  }
}

const player0: Player = {
  id: "A",
  characters: [0, 0, 0], //[0, 1, 2],
  piles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  handle,
};
const player1: Player = {
  id: "B",
  characters: [0, 0, 0], //[3, 4, 5],
  piles: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  handle,
};

createGame({
  pvp: true,
  players: [player0, player1],
});
