import { CharacterTag } from ".";
import { CharacterHandle, StatusHandle } from "./builders";

type ByPos = '<' | '|' | '>' | '<>' | '*';
type ById = `@${CharacterHandle}`;
type NoEnergy = `:energy(${number | "notFull"})`;
type HasStatus = `:has(${StatusHandle})`;
type WithTag = `:tag(${CharacterTag})`;
export type SimpleSelector = ById | ByPos | NoEnergy | HasStatus | WithTag;

type NoPrefixSelector<T extends string> = T extends SimpleSelector
  ? T
  : T extends `:recent(${infer Rel})`
  ? `:recent(${ValidSelector<Rel>})`
  : T extends `:exclude(${infer Rel})`
  ? `:exclude(${ValidSelector<Rel>})`
  : never;

type Prefix = "!" | "+";

export type ValidSelector<T extends string> =
  T extends `${infer P extends Prefix}${infer Rest}`
  ? `${P}${NoPrefixSelector<Rest>}`
  : T extends `#${number}` ? T : NoPrefixSelector<T>;
