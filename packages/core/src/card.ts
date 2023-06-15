import { CardData, CardEnableTester, CardInfo, CardWith, Context, HandlerResult, ICard, ICardConstructor, IGlobalEvents, getCardData } from "@jenshin-tcg/data";

export class Card {
  private readonly info: CardInfo;
  private readonly costs: number[];
  private readonly ctor: ICardConstructor;
  private readonly tester: CardEnableTester | undefined;

  /**
   * 
   * @param id 浮点数
   */
  constructor(public readonly id: number) {
    const data = getCardData(this.getObjectId());
    if (!data) {
      throw new Error("Unknown data id");
    }
    this.info = data.info;
    this.costs = data.costs;
    this.ctor = data.constructor;
    if (this.ctor.enableTester) {
      this.tester = new this.ctor.enableTester();
    }
  }

  getObjectId() {
    return Math.floor(this.id);
  }

  handle<K extends keyof IGlobalEvents>(event: K, ...c: Parameters<Required<IGlobalEvents>[K]>) {
    if (!this.tester) return;
    const handler = this.tester[event];
    if (handler) {
      // @ts-expect-error Shamefully ignore the type check
      handler(...c);
    }
  }

  use(ch: CardWith) {
    if (this.tester && !this.tester.enabled) {
      return null;
    }
    if (this.ctor.checkWith) {
      if (!this.ctor.checkWith(ch)) {
        return null;
      }
    }
    const inst = new this.ctor();
    return {
      id: this.id,
      with: [ch],
      do: inst.onUse.bind(inst),
    };
  }
}
