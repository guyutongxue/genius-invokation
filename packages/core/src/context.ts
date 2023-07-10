import {
  CardTag,
  CharacterContext,
  Context,
  SpecialBits,
  StatusContext,
  SummonContext,
  Target,
  TargetInfo,
  UseDiceContext,
  getTargetInfo,
} from "@gi-tcg/data";
import { GameState, flip } from "./state.js";
import { DamageType, DiceType } from "@gi-tcg/typings";
import { CharacterPosition } from "./player.js";
import { Character } from "./character.js";

export type ContextFactory<T> = (entityId: number) => T | null;

export class ContextImpl implements Context {
  constructor(protected state: GameState, public readonly who: 0 | 1) {
  }

  get currentPhase(): "action" | "end" | "other" {
    const phase = this.state.getPhase();
    if (phase === "action" || phase === "end") {
      return phase;
    } else {
      return "other";
    }
  }
  get currentTurn(): number {
    return this.state.getCurrentTurn();
  }
  isMyTurn(): boolean {
    return this.currentTurn === this.who;
  }
  checkSpecialBit(bit: SpecialBits): boolean {
    return this.state.getPlayer(this.who).getSpecialBit(bit);
  }

  private getCharacterFromTarget(t: Target | TargetInfo): CharacterContextImpl[] {
    const info = t instanceof Target ? getTargetInfo(t) : t;
    const createCharacterContext = (character: Character): CharacterContextImpl => {
      return new CharacterContextImpl(this.state, this.who, character);
    }
    switch (info.type) {
      case "byPos": {
        const player = this.state.getPlayer(info.opp ? flip(this.who) : this.who);
        let positions: CharacterPosition[];
        if (info.pos === "all") {
          positions = ["prev", "active", "next"];
        } else if (info.pos === "standby") {
          positions = ["prev", "next"];
        } else {
          positions = [info.pos];
        }
        const characters = new Set(positions.map((pos) => player.getCharacter(pos)));
        return [...characters].map(createCharacterContext);
      }
      case "oneEnergyNotFull": {
        const player = this.state.getPlayer(this.who);
        const try1 = player.getCharacter("active");
        if (!try1.fullEnergy()) return [createCharacterContext(try1)];
        const try2 = player.getCharacter("next");
        if (!try2.fullEnergy()) return [createCharacterContext(try2)];
        const try3 = player.getCharacter("prev");
        if (!try3.fullEnergy()) return [createCharacterContext(try3)];
        return [];
      }
      case "byEntityId": {
        const player = this.state.getPlayer(this.who);
        const character = player.getCharacterById(info.entityId);
        return character ? [createCharacterContext(character)] : [];
      }
      case "byId": {
        const player = this.state.getPlayer(this.who);
        const character = player.getCharacterById(info.id, true);
        return character ? [createCharacterContext(character)] : [];
      }
      case "recentOpp": {
        const relativeCtx = this.getCharacterFromTarget(info.relativeTo);
        if (relativeCtx.length === 0) return [];
        const relative = relativeCtx[0];
        const targetPlayer = this.state.getPlayer(flip(relative.who));
        const targetCharacter = targetPlayer.getCharacterByPos(relative.indexOfPlayer());
        return [createCharacterContext(targetCharacter)];
      }
      default: {
        const _: never = info;
        throw new Error(`Unknown target info type: ${_}`);
      }
    }
  }

  hasCharacter(ch: number | Target): CharacterContext | null {
    const t: Target = typeof ch === "number" ? Target.ofCharacter(ch as any): ch;
    const ctx = this.getCharacterFromTarget(t);
    if (ctx.length === 0) return null;
    return ctx[0];
  }
  allCharacters(
    opp?: boolean | undefined,
    includesDefeated?: boolean | undefined
  ): CharacterContext[] {}
  fullSupportArea(opp: boolean): boolean {}
  hasSummon(summon: number): SummonContext | null {}
  allSummons(): SummonContext[] {}

  hasCombatStatus(status: number): StatusContext | null {}
  hasCombatShield(): StatusContext | null {}

  dealDamage(
    value: number,
    type: DamageType,
    target?: Target | undefined
  ): void {}
  applyElement(type: DamageType, target?: Target | undefined): void {}
  heal(value: number, target: Target): void {}
  gainEnergy(value?: number | undefined, target?: Target | undefined): number {}
  loseEnergy(value?: number | undefined, target?: Target | undefined): number {}

  createStatus(status: number, target?: Target | undefined): StatusContext {}
  removeStatus(status: number, target?: Target | undefined): boolean {}
  createCombatStatus(
    status: number,
    opp?: boolean | undefined
  ): StatusContext {}

  summon(summon: number): void {}
  summonOneOf(...summons: number[]): void {}
  createSupport(support: number, opp?: boolean | undefined): void {}

  getDice(): DiceType[] {}
  rollDice(count: number): Promise<void> {}
  generateDice(...dice: DiceType[]): void {}
  removeAllDice(): DiceType[] {}

  getCardCount(opp?: boolean | undefined): number {}
  drawCards(
    count: number,
    opp?: boolean | undefined,
    tag?: CardTag | undefined
  ): void {}
  createCards(...cards: number[]): void {}
  switchCards(): Promise<void> {}

  switchActive(target: Target): void {}
  useSkill(skill: number | "normal"): void {}

  flipNextTurn(): void {}

  getMaster(): CharacterContext {}
  asStatus(): StatusContext {}
  dispose(): void {}
}

class CharacterContextImpl extends ContextImpl implements CharacterContext {
  constructor(state: GameState, who: 0 | 1, protected character: Character) {
    super(state, who);
  }
  get entityId() {
    return this.character.entityId;
  }
  indexOfPlayer() {
    return this.state.getPlayer(this.who).characters.findIndex((c) => c.entityId === this.entityId);
  }
}

type A = UseDiceContext;
