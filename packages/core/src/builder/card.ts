import {
  CardTag,
  CardTarget,
  CardTargetKind,
  CardType,
  PlayCardFilter,
  PlayCardTargetGetter,
  SupportTag,
  WeaponCardTag,
} from "../base/card";
import { registerCard, registerSkill } from "./registry";
import { SkillDescription } from "../base/skill";
import { ExtendedSkillContext, SkillContext } from "./context";
import {
  SkillBuilderWithCost,
  extendSkillContext,
  enableShortcut,
  BuilderWithShortcut,
} from "./skill";
import {
  CardHandle,
  CharacterHandle,
  ExContextType,
  ExEntityType,
} from "./type";
import { CharacterState, EntityState, GameState } from "../base/state";
import { getEntityById } from "../util";

type StateOf<TargetKindTs extends CardTargetKind> =
  TargetKindTs extends readonly [
    infer First extends ExEntityType,
    ...infer Rest extends CardTargetKind,
  ]
    ? readonly [
        First extends "character" ? CharacterState : EntityState,
        ...StateOf<Rest>,
      ]
    : readonly [];

interface CardTargetExt<TargetKindTs extends CardTargetKind> {
  targets: StateOf<TargetKindTs>;
}

type PredFn<KindTs extends CardTargetKind> = (
  ctx: ExtendedSkillContext<true, CardTargetExt<KindTs>, "character">,
) => boolean;

type TargetQuery = `${string}character${string}` | `${string}summon${string}`;
type TargetKindOfQuery<Q extends TargetQuery> =
  Q extends `${string}character${string}` ? "character" : "summon";

class CardBuilder<KindTs extends CardTargetKind> extends SkillBuilderWithCost<
  CardTargetExt<KindTs>
> {
  private _type: CardType = "event";
  private _tags: CardTag[] = [];
  private _filters: PredFn<KindTs>[] = [];
  private _talentCh: number | null = null;

  private _targetQueries: string[] = [];

  constructor(private readonly cardId: number) {
    super(cardId);
  }

  tags(...tags: CardTag[]): this {
    this._tags.push(...tags);
    return this;
  }
  type(type: CardType): this {
    this._type = type;
    return this;
  }
  equipment() {
    this.type("equipment");
    return this; // TODO
  }
  weapon(type: WeaponCardTag) {
    return this.tags("weapon", type).equipment();
  }
  artifact() {
    return this.tags("artifact").equipment();
  }
  support(type: SupportTag) {
    this.type("support").tags(type);
    return this; // TODO
  }

  addTarget<Q extends TargetQuery>(
    targetQuery: Q,
  ): BuilderWithShortcut<
    CardTargetExt<readonly [...KindTs, TargetKindOfQuery<Q>]>,
    "character",
    CardBuilder<readonly [...KindTs, TargetKindOfQuery<Q>]>
  > {
    this._targetQueries = [...this._targetQueries, targetQuery];
    return this as any;
  }

  legend(): this {
    return this.tags("legend");
  }

  talentOf(ch: CharacterHandle, opt?: { action?: boolean }): this {
    this._talentCh = ch;
    const action = opt?.action ?? true;
    // TODO: deck requirements
    if (action) {
      // TODO: set active ch filter
      this.tags("action");
    }
    // TODO: target filter
    return this;
  }

  filter(pred: PredFn<KindTs>): this {
    this._filters.push(pred);
    return this;
  }

  // 用于 filter 和 target
  private getFakeSkillContext(
    state: GameState,
    caller: CharacterState,
  ): SkillContext<true, {}, "character"> {
    return new SkillContext(state, {
      caller,
      definition: null!,
      fromCard: null,
      requestBy: null,
    });
  }

  private generateTargetList(
    state: GameState,
    caller: CharacterState,
    known: number[],
    targetQuery: string[],
  ): number[][] {
    if (targetQuery.length === 0) {
      return [[]];
    }
    const [first, ...rest] = targetQuery;
    const ctx = this.getFakeSkillContext(state, caller);
    const targets = known.map((id) => getEntityById(state, id, true));
    const wrapped = new Proxy(ctx, {
      get(target, prop, receiver) {
        if (prop === "targets") {
          return targets;
        } else {
          return Reflect.get(target, prop, receiver);
        }
      },
    });
    const ids = wrapped.$$(first).map((c) => c.state.id);
    return ids.flatMap((id) =>
      this.generateTargetList(state, caller, [...known, id], rest).map((l) => [
        id,
        ...l,
      ]),
    );
  }

  done(): CardHandle {
    // 将卡牌目标 ID 列表转换为扩展点 `CardTargetExt`
    const cardTargetToExt = (
      skillCtx: SkillContext<boolean, any, "character">,
      ids: number[],
    ): CardTargetExt<KindTs> => {
      const targets = ids.map((id) => getEntityById(skillCtx.state, id, true));
      return {
        targets: targets as any,
      };
    };
    const action: SkillDescription<CardTarget> = (state, callerId, { ids }) => {
      const targetExtGenerator = (
        skillCtx: SkillContext<false, any, any>,
      ): CardTargetExt<KindTs> => {
        return cardTargetToExt(skillCtx, ids);
      };
      const innerAction: SkillDescription<void> =
        this.getAction(targetExtGenerator);
      return innerAction(state, callerId);
    };
    const filterFn: PlayCardFilter = (state, caller, { ids }) => {
      const ctx = this.getFakeSkillContext(state, caller);
      const ext = cardTargetToExt(ctx, ids);
      const wrappedCtx = extendSkillContext<
        true,
        CardTargetExt<KindTs>,
        "character"
      >(ctx, ext);
      for (const filter of this._filters) {
        if (!filter(wrappedCtx)) {
          return false;
        }
      }
      return true;
    };
    const targetGetter: PlayCardTargetGetter = (state, caller) => {
      const targetIdsList = this.generateTargetList(
        state,
        caller,
        [],
        this._targetQueries,
      );
      return targetIdsList.map((ids) => ({ ids }));
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
      getTarget: targetGetter,
      filter: filterFn,
      skillDefinition: skillDef,
    });
    return this.cardId as CardHandle;
  }
}

export function card(id: number) {
  return enableShortcut(new CardBuilder<[]>(id));
}
