import { GameState } from ".";
import { QueryArgs } from "./query/semantic";

export abstract class GiTcgError extends Error {}

export class GiTcgCoreInternalError extends GiTcgError {}

export class GiTcgCoreInternalEntityNotFoundError extends GiTcgCoreInternalError {
  constructor(
    public readonly state: GameState,
    public readonly id: number,
  ) {
    super(`Cannot found entity ${id}`);
  }
}

export class GiTcgDataError extends GiTcgError {}

export class GiTcgQueryError extends GiTcgDataError {
  constructor(
    public readonly source: string,
    public readonly args: QueryArgs,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

export class GiTcgIOError extends GiTcgError {
  constructor(
    public readonly who: 0 | 1,
    message?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}
