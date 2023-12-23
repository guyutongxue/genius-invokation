import {
  CardTag,
  CardTarget,
  CardTargetKind,
  CardType,
  DeckRequirement,
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
  CombatStatusHandle,
  EquipmentHandle,
  ExEntityType,
  StatusHandle,
  SupportHandle,
} from "./type";
import { CharacterState, EntityState, GameState } from "../base/state";
import { getEntityById } from "../util";
import { combatStatus, status } from ".";
import { equipment, support } from "./entity";
import { CharacterTag } from "../base/character";

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
  private _deckRequirement: DeckRequirement = {};

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
    this.do((c) => {
      c.$("my active character")!.equip(this.cardId as EquipmentHandle);
    }).done();
    return equipment(this.cardId);
  }
  weapon(type: WeaponCardTag) {
    return this.tags("weapon", type).equipment().tags("weapon", type);
  }
  artifact() {
    return this.tags("artifact").equipment().tags("artifact");
  }
  support(type: SupportTag) {
    this.type("support").tags(type);
    this.do((c) => {
      c.createEntity("support", this.cardId as SupportHandle);
    }).done();
    return support(this.cardId).tags(type);
  }

  toCombatStatus(id?: number) {
    this.do((c) => {
      c.combatStatus(id as CombatStatusHandle);
    }).done();
    return combatStatus(id ?? this.cardId);
  }
  toStatus(target: string, id?: number) {
    this.do((c) => {
      c.characterStatus(id as StatusHandle, target);
    }).done();
    return status(id ?? this.cardId);
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

  talentOf(ch: CharacterHandle, opt?: { action?: boolean }) {
    this._talentCh = ch;
    const action = opt?.action ?? true;
    this._deckRequirement.character = ch;
    if (action) {
      // TODO: set active ch filter
      this.tags("action");
    }
    // TODO: target filter
    return this.tags("talent");
  }

  requireCharacterTag(tag: CharacterTag): this {
    this._deckRequirement.dualCharacterTag = tag;
    return this;
  }

  filter(pred: PredFn<KindTs>): this {
    this._filters.push(pred);
    return this;
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
    const ctx = this.getFakeSkillContext(state, caller, (ctx) =>
      CardBuilder.cardTargetToExt(ctx, known),
    );
    const ids = ctx.$$(first).map((c) => c.state.id);
    return ids.flatMap((id) =>
      this.generateTargetList(state, caller, [...known, id], rest).map((l) => [
        id,
        ...l,
      ]),
    );
  }

  // 将卡牌目标 ID 列表转换为扩展点 `CardTargetExt`
  private static readonly cardTargetToExt = (
    skillCtx: SkillContext<boolean, any, "character">,
    ids: number[],
  ): CardTargetExt<any> => {
    const targets = ids.map((id) => getEntityById(skillCtx.state, id, true));
    return {
      targets: targets as any,
    };
  };

  done(): CardHandle {
    const action: SkillDescription<CardTarget> = (state, skillInfo, { ids }) => {
      const innerAction: SkillDescription<void> = this.getAction((ctx) =>
        CardBuilder.cardTargetToExt(ctx, ids),
      );
      return innerAction(state, skillInfo);
    };
    const filterFn: PlayCardFilter = (state, caller, { ids }) => {
      const ctx = this.getFakeSkillContext(state, caller, (ctx) =>
        CardBuilder.cardTargetToExt(ctx, ids),
      );
      for (const filter of this._filters) {
        if (!filter(ctx)) {
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
      tags: this._tags,
      deckRequirement: this._deckRequirement,
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
