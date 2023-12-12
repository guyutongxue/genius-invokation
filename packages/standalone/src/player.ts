import { DiceType, PlayerConfig, PlayerIO, StateData } from "@gi-tcg/core";
import {
  RpcMethod,
  RpcRequest,
  RpcResponse,
  Action,
  ActionResponse,
} from "@gi-tcg/typings";
import { ref } from "vue";
import { mittWithOnce } from "./util";

export type View = "normal" | "reroll" | "switchCards";

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

export class Player {
  public readonly io: PlayerIO;

  public readonly state = ref<StateData>();
  public readonly clickable = ref<number[]>([]);
  public readonly selected = ref<number[]>([]);
  public readonly view = ref<View>("normal");
  public readonly selectDiceOpt = ref<SelectDiceOpt>({ enabled: false });
  public readonly canDeclareEnd = ref(false);

  private emitter = mittWithOnce<{
    clicked: number;
    selected: SelectResult;
  }>();

  constructor(
    public readonly config: PlayerConfig,
    public readonly who: 0 | 1
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
    req: RpcRequest[M]
  ): Promise<RpcResponse[M]> {
    const res = await this.doRpc(m, req);
    console.log("rpc", this.who, m, req, res);
    return res as RpcResponse[M];
  }

  private async doRpc<M extends RpcMethod>(
    m: M,
    req: RpcRequest[M]
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
    // this.clickable.value = candidates;
    this.canDeclareEnd.value = true;
    this.clickable.value = [];
    

    for (const [action, i] of candidates.map((v, i) => [v, i] as const)) {
      switch (action.type) {
        case "useSkill":
        case "playCard":
        case "switchActive":
        case "elementalTuning":
        case "declareEnd": {
          this.canDeclareEnd.value = true;
        }
      }
    }
    const val = await this.waitForClick();

    return new Promise<never>(() => {});
  }
}
