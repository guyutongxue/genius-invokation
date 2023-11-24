import { CardTarget, CardTargetKind, CardType, PlayCardFilter } from "../card";
import { registerCard, registerSkill } from "../registry";
import { SkillDescription } from "../skill";
import { ExtendedSkillContext, SkillContext } from "./context";
import { SkillBuilderWithCost, extendSkillContext } from "./skill";
import { CardHandle, ExContextType, ExEntityType } from "./type";

type ContextOf<
  Readonly extends boolean,
  TargetKindTs extends CardTargetKind,
> = TargetKindTs extends readonly [
  infer First extends ExEntityType,
  ...infer Rest extends CardTargetKind,
]
  ? readonly [ExContextType<Readonly, First>, ...ContextOf<Readonly, Rest>]
  : readonly [];

interface CardTargetExt<
  Readonly extends boolean,
  TargetKindTs extends CardTargetKind,
> {
  targets: ContextOf<Readonly, TargetKindTs>;
}

type PredFn<KindTs extends CardTargetKind> = (
  ctx: ExtendedSkillContext<true, CardTargetExt<true, KindTs>, "character">,
) => boolean;

class CardBuilder<KindTs extends CardTargetKind> extends SkillBuilderWithCost<
  CardTargetExt<false, KindTs>
> {
  private _type: CardType = "event";
  private _filters: PredFn<KindTs>[] = [];
  constructor(
    private readonly cardId: number,
    private readonly targetKinds: CardTargetKind,
  ) {
    super(cardId);
  }

  filter(pred: PredFn<KindTs>) {
    this._filters.push(pred);
    return this;
  }

  done(): CardHandle {
    // 将卡牌目标 ID 列表转换为扩展点 `CardTargetExt`
    const cardTargetToExt = (
      skillCtx: SkillContext<boolean, any, "character">,
      ids: number[],
    ): CardTargetExt<boolean, KindTs> => {
      const targets = [];
      for (let i = 0; i < this.targetKinds.length; i++) {
        targets.push(skillCtx.query(this.targetKinds[i]).byId(ids[i]).one());
      }
      return {
        targets: targets as any,
      };
    };
    const action: SkillDescription<CardTarget> = (state, callerId, { ids }) => {
      const targetExtGenerator = (
        skillCtx: SkillContext<false, any, any>,
      ): CardTargetExt<false, KindTs> => {
        return cardTargetToExt(skillCtx, ids);
      };
      const innerAction: SkillDescription<void> =
        this.getAction(targetExtGenerator);
      return innerAction(state, callerId);
    };
    const filterFn: PlayCardFilter = (state, { ids }) => {
      const ctx = new SkillContext<true, any, any>(state, this.cardId, this.cardId);
      const ext = cardTargetToExt(ctx, ids);
      const wrappedCtx = extendSkillContext<
        true,
        CardTargetExt<true, KindTs>,
        "character"
      >(ctx, ext);
      for (const filter of this._filters) {
        if (!filter(wrappedCtx)) {
          return false;
        }
      }
      return true;
    };
    const skillDef = {
      type: "skill" as const,
      skillType: "card" as const,
      id: this.cardId,
      triggerOn: null,
      costs: this._cost,
      action,
    };
    registerSkill(skillDef);
    registerCard({
      id: this.cardId,
      type: this._type,
      tags: [], // TODO
      deckRequirement: {}, // TODO
      target: this.targetKinds,
      filter: filterFn,
      action: skillDef,
    });
    return this.cardId as CardHandle;
  }
}

export function card<const KindTs extends CardTargetKind>(
  id: number,
  targetKinds: KindTs,
): CardBuilder<KindTs>;
export function card(id: number): CardBuilder<readonly []>;
export function card(id: number, targetKinds: CardTargetKind = []) {
  return new CardBuilder(id, targetKinds);
}
