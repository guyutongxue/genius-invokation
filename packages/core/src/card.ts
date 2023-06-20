import { CardData, CardEnableTester, CardInfo, CardWith, CardWithInfo, Context, HandlerResult, ICard, ICardConstructor, IGlobalEvents, getCardData } from "@jenshin-tcg/data";

export class Card {
  private readonly info: CardInfo;
  readonly cost: number[];
  private readonly ctor: ICardConstructor;
  private readonly tester: CardEnableTester | undefined;

  /**
   * 
   * @param id 浮点数
   */
  constructor(public readonly id: number) {
    const data = getCardData(this.objectId);
    if (!data) {
      throw new Error("Unknown data id");
    }
    this.info = data.info;
    this.cost = data.costs;
    this.ctor = data.ctor;
    if (this.ctor.enableTester) {
      this.tester = new this.ctor.enableTester();
    }
  }

  get objectId() {
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

  withInfo() : CardWithInfo | undefined {
    return this.info.with?.[0];
  }

  getAction(ch?: CardWith) {
    if (this.tester && !this.tester.enabled) {
      return null;
    }
    if (ch && this.ctor.checkWith) {
      if (!this.ctor.checkWith(ch)) {
        return null;
      }
    }
    const inst = new this.ctor(ch);
    return inst.onUse.bind(inst);
  }
}
