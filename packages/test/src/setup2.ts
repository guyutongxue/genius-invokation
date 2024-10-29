import {
  Aura,
  CardHandle,
  CharacterHandle,
  CombatStatusHandle,
  EquipmentHandle,
  StatusHandle,
  SummonHandle,
  SupportHandle,
} from "@gi-tcg/core/builder";
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
}

export function ref(): Ref {
  return new Ref();
}

export interface CommonEntityJsxProp {
  my?: boolean;
  opp?: boolean;
  v?: Record<string, number>;
  ref?: Ref;
}

export namespace Character {
  export interface Prop extends CommonEntityJsxProp {
    active?: boolean;
    def?: CharacterHandle;
    health?: number;
    energy?: number;
    maxHealth?: number;
    aura?: Aura;
    alive?: 0 | 1;
    children?: JSX.Element[] | JSX.Element;
  }
}
export function Character(props: Character.Prop): JSX.Element {
  return [Character, props];
}

export interface EntityProp extends CommonEntityJsxProp {
  usage?: number;
  usagePerRound?: number;
  shield?: number;
  duration?: number;
}

export namespace Summon {
  export interface Prop extends EntityProp {
    def?: SummonHandle;
  }
}
export function Summon(props: Summon.Prop): JSX.Element {
  return [Summon, props];
}

export namespace CombatStatus {
  export interface Prop extends EntityProp {
    def?: CombatStatusHandle;
  }
}
export function CombatStatus(props: CombatStatus.Prop): JSX.Element {
  return [CombatStatus, props];
}

export namespace Status {
  export interface Prop extends EntityProp {
    def?: StatusHandle;
  }
}
export function Status(props: Status.Prop): JSX.Element {
  return [Status, props];
}
export namespace Equipment {
  export interface Prop extends EntityProp {
    def?: EquipmentHandle;
  }
}
export function Equipment(props: Equipment.Prop): JSX.Element {
  return [Equipment, props];
}

export namespace Support {
  export interface Prop extends EntityProp {
    def?: SupportHandle;
  }
}
export function Support(props: Support.Prop): JSX.Element {
  return [Support, props];
}
export namespace Card {
  export interface Prop extends CommonEntityJsxProp {
    def?: CardHandle;
    deck?: boolean;
    /** 并非来自初始牌堆 */
    notInitial?: boolean;
  }
}
export function Card(props: Card.Prop): JSX.Element {
  return [Card, props];
}

export namespace State {
  export interface Prop {
    dataVersion?: number;
    enableRoll?: boolean;
    phase?: string;
    currentTurn?: "my" | "opp";
    roundNumber?: number;

    children?: JSX.Element[] | JSX.Element;
  }
}
export function State(props: State.Prop): JSX.Element {
  return [State, props];
}

function assertJsxElement<PropsT>(element: JSX.Element, comp: Function): PropsT {
  const [comp2, props] = element;
  if (comp2 !== comp) {
    throw new Error(`Expect ${comp.name} but got ${comp2.name}`);
  }
  return props as PropsT;
}

function childrenToArray(children?: JSX.Element[] | JSX.Element): JSX.Element[] {
  if (typeof children === "undefined") {
    return [];
  }
  if (Array.isArray(children)) {
    return children;
  }
  return [children];
}

export function setup(state: JSX.Element) {
  const { children } = assertJsxElement<State.Prop>(state, State);
  const childrenArray = childrenToArray(children);
  return state;
}
