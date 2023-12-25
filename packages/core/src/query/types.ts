export type GuessedTypeOfQuery<Q extends string> = Q extends
  | `${string}character${string}`
  | `${string}active${string}`
  | `${string}prev${string}`
  | `${string}next${string}`
  | `${string}standby${string}`
  ? "character"
  : Q extends `${string}summon${string}`
    ? "summon"
    : Q extends `${string}combat status${string}`
      ? "combatStatus"
      : Q extends `${string}support${string}`
        ? "support"
        : Q extends `${string}status${string}`
          ? "status"
          : Q extends `${string}equipment${string}`
            ? "equipment"
            : any;
