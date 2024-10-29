import { CharacterHandle } from "@gi-tcg/core/builder";
import { JSX } from "#jsx/jsx-runtime";

let _nextId = -5000000;
function nextId() {
  return _nextId++;
}

class Ref {
  #_marker = null;
  readonly id: number;
  constructor() {
    this.id = nextId();
  }
};

export function ref(): Ref {
  return new Ref();
}


export interface CommonEntityJsxProp {
  my?: boolean;
  opp?: boolean;
  v?: Record<string, number>;
  ref?: Ref;
};

function wrap(value?: any): JSX.Element {
  return value;
}

export namespace Character {
  export interface Prop extends CommonEntityJsxProp {
    active?: boolean;
    def?: CharacterHandle;
    health?: number;
    energy?: number;
    maxHealth?: number;
    alive?: 0 | 1;
  }
}

export function Character(props: Character.Prop) {
  return wrap(props);
}

export function State(props: { children?: JSX.Element[] }) {
  return wrap(props);
}
