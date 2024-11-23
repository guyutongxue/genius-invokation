declare module "@gi-tcg/cbinding-io" {
  export function io(
    gameId: number,
    ioType: number,
    who: 0 | 1,
    data: any,
  ): any;
}
