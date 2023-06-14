import { DiceType } from "@jenshin-tcg/typings";
import { CharacterInfo } from "./interfaces/character";
import { SkillInfo, SkillType } from "./interfaces/skill";
import { Context } from "./contexts";
import { IStatus, StatusInfo } from "./interfaces/status";
import { CardInfo } from "./interfaces/card";

type Writable<T> = { -readonly [P in keyof T]: T[P] };

export const characterSymbol: unique symbol = Symbol("character");

export interface CharacterData {
  info: CharacterInfo;
  skill: SkillInfoWithSignature[];
}

type SkillSignature = (this: any, c: Context) => void;
type AttachedSkillInfo = Writable<SkillInfo>;
type SkillInfoWithSignature = AttachedSkillInfo & { do: SkillSignature };

export function Character(info: CharacterInfo) {
  return (target: any, ctx: ClassDecoratorContext): any => {
    if (characterSymbol in target)
      throw new Error("Decorating multiple times");
    const skills: SkillInfoWithSignature[] = [];
    target[characterSymbol] = {
      info,
      skills,
    };
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
      const method = target.prototype[key];
      if (hasSkill(method)) {
        const skill = method[skillSymbol];
        skills.push({
          ...skill,
          do: method,
        });
      }
    }
    return target;
  };
}

type SkillMethod = {
  [skillSymbol]: AttachedSkillInfo;
} & SkillSignature;

const skillSymbol: unique symbol = Symbol("skill");
function hasSkill(method: SkillSignature): method is SkillMethod {
  return skillSymbol in method;
}
function addSkill(method: SkillSignature): asserts method is SkillMethod {
  if (hasSkill(method)) return;
  Object.defineProperty(method, skillSymbol, {
    value: {},
  });
}

function addSkillType(type: SkillType) {
  return (
    target: SkillSignature,
    ctx: ClassMethodDecoratorContext
  ): SkillMethod => {
    addSkill(target);
    const skill = target[skillSymbol];
    if (skill?.type)
      throw new Error(`Cannot have multiple skill types for ${String(name)}`);
    skill.type = type;
    skill.name = String(ctx.name);
    return target;
  };
}

export const Normal = addSkillType("normal");
export const Skill = addSkillType("skill");
export const Burst = addSkillType("burst");

function cost(type: DiceType) {
  return (value: number) => {
    function decorate(
      target: SkillSignature,
      ctx: ClassMethodDecoratorContext
    ): SkillMethod;
    function decorate(target: any, ctx: ClassDecoratorContext): never;
    function decorate(
      target: any,
      ctx: ClassDecoratorContext | ClassMethodDecoratorContext
    ): SkillMethod {
      if (ctx.kind === "method") {
        addSkill(target);
        const skill = target[skillSymbol];
        skill.costs = skill.costs ?? [];
        skill.costs.push(...new Array(value).fill(type));
        return target;
      } else {
        throw new Error("Unimplemented");
      }
    }
    return decorate;
  };
}

export const Any = cost(DiceType.ANY);
export const Cryo = cost(DiceType.CRYO);
export const Hydro = cost(DiceType.HYDRO);
export const Pyro = cost(DiceType.PYRO);
export const Electro = cost(DiceType.ELECTRO);
export const Anemo = cost(DiceType.ANEMO);
export const Geo = cost(DiceType.GEO);
export const Dendro = cost(DiceType.DENDRO);
export const Omni = cost(DiceType.OMNI);
// export const Energy = cost(DiceType.ENERGY);

export const statusSymbol: unique symbol = Symbol("status");

export function Status(info: StatusInfo) {
  return (target: any, ctx: ClassDecoratorContext): any => {
    if (statusSymbol in target)
      throw new Error("Decorating multiple times");
    target[statusSymbol] = {
      info,
      actions: new target(),
    };
    return target;
  };
}

export interface StatusData {
  info: StatusInfo;
  actions: IStatus;
}

export interface CardData {
  info: CardInfo;
  // do: unknown;
}
