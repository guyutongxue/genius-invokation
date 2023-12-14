import { PlayerConfig, PlayerIO, StateData } from "@gi-tcg/core";
import {
  DiceType,
  RpcMethod,
  RpcRequest,
  RpcResponse,
  Action,
  ActionResponse,
  PlayCardAction,
} from "@gi-tcg/typings";
import { ref } from "vue";
import { mittWithOnce } from "./util";

export type View = "normal" | "reroll" | "switchCards";

/** 点击“结束回合”的行为 ID */
export const DECLARE_END_ID = 0;
/**  将卡牌作为元素调和素材时的点击行为 ID*/
export const ELEMENTAL_TUNING_OFFSET = -11072100;

type SelectDiceOpt =
  | {
      enabled: false;
    }
  | {
      enabled: true;
      required: DiceType[];
      disableOmni: boolean;
      disableOk: boolean;
      disableCancel: boolean;
    };

type SelectResult = number[] | false;

type AfterClickState =
  | {
      type: "continue";
      clickable: Map<number, AfterClickState>;
      selected: number[];
    }
  | {
      type: "selectDice";
      selected: number[];
      actionIndex: number;
      required: DiceType[];
      disableOmni: boolean;
    };

function groupBy<T, K>(list: T[], getKey: (item: T) => K): Map<K, T[]> {
  return list.reduce((result, item) => {
    const key = getKey(item);
    const collection = result.get(key);
    if (!collection) {
      result.set(key, [item]);
    } else {
      collection.push(item);
    }
    return result;
  }, new Map<K, T[]>());
}
interface PCAWithIndex extends PlayCardAction {
  index: number;
}

function buildCardClickState(
  cardAction: PCAWithIndex[],
): Map<number, AfterClickState> {
  type TargetTree = PCAWithIndex | Map<number, TargetTree>;

  function traverseTargetTree(
    selected: number[],
    node: TargetTree,
  ): AfterClickState {
    if (node instanceof Map) {
      const clickable = new Map<number, AfterClickState>();
      for (const [key, value] of node) {
        clickable.set(key, traverseTargetTree([...selected, key], value));
      }
      return {
        type: "continue",
        clickable,
        selected,
      };
    } else {
      return {
        type: "selectDice",
        selected,
        actionIndex: node.index,
        required: node.cost,
        disableOmni: false,
      };
    }
  }

  const grouped = groupBy(cardAction, (v) => v.card);
  const clickable = new Map<number, AfterClickState>();
  for (const [key, value] of grouped) {
    if (value[0].targets.length === 0) {
      clickable.set(key, {
        type: "selectDice",
        selected: [key],
        actionIndex: value[0].index,
        required: value[0].cost,
        disableOmni: false,
      });
      continue;
    }
    const targetTree = new Map<number, TargetTree>();
    for (const action of value) {
      const targets = [...action.targets];
      let current = targetTree;
      while (targets.length > 1) {
        const target = targets.shift()!;
        let next = current.get(target);
        if (!next) {
          next = new Map<number, TargetTree>();
          current.set(target, next);
        }
        current = next as Map<number, TargetTree>;
      }
      current.set(targets[0], action);
    }
    console.log(targetTree);
    clickable.set(key, traverseTargetTree([key], targetTree));
  }
  return clickable;
}

export class Player {
  public readonly io: PlayerIO;

  public readonly state = ref<StateData>();
  public readonly clickable = ref<number[]>([]);
  public readonly selected = ref<number[]>([]);
  public readonly view = ref<View>("normal");
  public readonly selectDiceOpt = ref<SelectDiceOpt>({ enabled: false });

  private emitter = mittWithOnce<{
    clicked: number;
    selected: SelectResult;
  }>();

  constructor(
    public readonly config: PlayerConfig,
    public readonly who: 0 | 1,
  ) {
    this.io = {
      giveUp: false,
      notify: ({ newState, events, mutations }) => {
        this.state.value = newState;
      },
      rpc: (m, r) => this.rpc(m, r),
    };
  }

  entityClicked(id: number) {
    this.emitter.emit("clicked", id);
  }
  diceSelected(selected: SelectResult) {
    this.emitter.emit("selected", selected);
  }

  async rpc<M extends RpcMethod>(
    m: M,
    req: RpcRequest[M],
  ): Promise<RpcResponse[M]> {
    const res = await this.doRpc(m, req);
    console.log("rpc", this.who, m, req, res);
    return res as RpcResponse[M];
  }

  private async doRpc<M extends RpcMethod>(
    m: M,
    req: RpcRequest[M],
  ): Promise<RpcResponse[RpcMethod]> {
    switch (m) {
      case "chooseActive": {
        const { candidates } = req as RpcRequest["chooseActive"];
        const active = await this.chooseActive(candidates);
        return {
          active,
        } as RpcResponse["chooseActive"];
      }
      case "rerollDice": {
        return {
          rerollIndexes: [],
        } as RpcResponse["rerollDice"];
      }
      case "action": {
        const { candidates } = req as RpcRequest["action"];
        const res = await this.action(candidates);
        return res as RpcResponse["action"];
      }
      default:
        throw new Error("Not implemented");
    }
  }

  private async waitForClick(): Promise<number> {
    const val = await new Promise<number>((resolve) => {
      this.emitter.once("clicked", resolve);
    });
    return val;
  }

  private async waitForSelected(): Promise<SelectResult> {
    const val = await new Promise<SelectResult>((resolve) => {
      this.emitter.once("selected", resolve);
    });
    return val;
  }

  private async chooseActive(candidates: number[]) {
    this.clickable.value = candidates;
    const onClick = (id: number) => {
      this.selected.value = [id];
      this.selectDiceOpt.value = {
        enabled: true,
        disableCancel: true,
        disableOk: false,
        disableOmni: false,
        required: [],
      };
    };
    this.selectDiceOpt.value = {
      enabled: true,
      disableCancel: true,
      disableOk: true,
      disableOmni: false,
      required: [],
    };
    this.emitter.on("clicked", onClick);
    await this.waitForSelected();
    this.selectDiceOpt.value = {
      enabled: false,
    };
    this.emitter.off("clicked", onClick);
    const result = this.selected.value[0];
    this.selected.value = [];
    this.clickable.value = [];
    return result;
  }

  private async action(candidates: Action[]): Promise<ActionResponse> {
    const player = this.state.value!.players[this.who];
    const currentEnergy =
      player.characters.find((ch) => ch.id === player.activeCharacterId)
        ?.energy ?? 0;
    const playCardInfos: PCAWithIndex[] = [];
    const initialClickable = new Map<number, AfterClickState>();
    for (const [action, i] of candidates.map((v, i) => [v, i] as const)) {
      if (
        "cost" in action &&
        action.cost.filter((d) => d === DiceType.Energy).length > currentEnergy
      ) {
        // If energy does not meet the requirement, disable it.
        continue;
      }
      switch (action.type) {
        case "useSkill": {
          initialClickable.set(action.skill, {
            type: "selectDice",
            actionIndex: i,
            disableOmni: false,
            required: action.cost,
            selected: [],
          });
          break;
        }
        case "playCard": {
          playCardInfos.push({ ...action, index: i });
          break;
        }
        case "switchActive": {
          initialClickable.set(action.active, {
            type: "selectDice",
            actionIndex: i,
            disableOmni: false,
            required: action.cost,
            selected: [],
          });
          break;
        }
        case "elementalTuning": {
          initialClickable.set(action.discardedCard + ELEMENTAL_TUNING_OFFSET, {
            type: "selectDice",
            actionIndex: i,
            disableOmni: true,
            required: [DiceType.Void],
            selected: [action.discardedCard],
          });
          break;
        }
        case "declareEnd": {
          initialClickable.set(0, {
            type: "selectDice",
            actionIndex: i,
            disableOmni: false,
            required: [],
            selected: [],
          });
        }
      }
    }
    for (const [k, v] of buildCardClickState(playCardInfos)) {
      initialClickable.set(k, v);
    }
    let result: ActionResponse;
    let state: AfterClickState = {
      type: "continue",
      clickable: initialClickable,
      selected: [],
    };
    while (true) {
      while (state.type === "continue") {
        this.clickable.value = [...state.clickable.keys()];
        this.selected.value = state.selected;
        const val = await this.waitForClick();
        if (!this.clickable.value.includes(val)) {
          throw new Error(`Click event emitted with an invalid value`);
        }
        state = state.clickable.get(val)!;
      }
      this.clickable.value = [];
      this.selected.value = state.selected;

      if (candidates[state.actionIndex].type === "declareEnd") {
        this.clickable.value = [];
        this.selected.value = [];
        result = {
          chosenIndex: state.actionIndex,
          cost: [],
        };
        break;
      }

      this.selectDiceOpt.value = {
        enabled: true,
        disableCancel: false,
        disableOk: false,
        disableOmni: state.disableOmni,
        required: state.required,
      };
      const [type, awaited] = await Promise.race([
        this.waitForSelected().then((r) => ["dice", r] as const),
        this.waitForClick().then((r) => ["click", r] as const),
      ]);
      if (type === "dice") {
        this.selectDiceOpt.value = {
          enabled: false,
        };
        if (awaited !== false) {
          result = {
            chosenIndex: state.actionIndex,
            cost: awaited,
          };
          break;
        }
        state = {
          type: "continue",
          clickable: initialClickable,
          selected: [],
        };
      }
    }
    this.selected.value = [];
    this.clickable.value = [];
    return result;
  }
}
