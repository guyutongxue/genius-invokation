import { DiceType } from "@jenshin-tcg/typings";
import { CharacterInfo, PassiveSkill } from "./interfaces/character";
import { ManualSkillType, SkillInfo, SkillType } from "./interfaces/skill";
import { Context, SkillDescriptionContext } from "./contexts";
import { IStatusConstructor, StatusInfo } from "./interfaces/status";
import { CardInfo, ICard, ICardConstructor } from "./interfaces/card";

type Writable<T> = { -readonly [P in keyof T]: T[P] };

export const characterSymbol: unique symbol = Symbol("character");

export interface CharacterData {
  info: CharacterInfo;
  skills: SkillInfoWithSignature[];
  passives: PassiveSkill;
}

type SkillSignature = (this: any, c: SkillDescriptionContext) => void;
type AttachedSkillInfo = Writable<SkillInfo>;
type SkillInfoWithSignature = AttachedSkillInfo & { do: SkillSignature };

export function Character(info: CharacterInfo) {
  return (target: any, ctx: ClassDecoratorContext): any => {
    if (characterSymbol in target) throw new Error("Decorating multiple times");
    const skills: SkillInfoWithSignature[] = [];
    const passives: PassiveSkill = {};
    target[characterSymbol] = {
      info,
      skills,
      passives,
    };
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
      const mem = target.prototype[key];
      if (hasSkill(mem)) {
        const skill = mem[skillSymbol];
        skills.push({
          ...skill,
          do: mem,
        });
      } else if (passiveSymbol in mem) {
        // @ts-expect-error no typings for passiveskill key
        passives[key] = mem;
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

function addSkillType(type: ManualSkillType) {
  return (
    target: SkillSignature,
    ctx: ClassMethodDecoratorContext
  ): SkillMethod => {
    addSkill(target);
    const skill = target[skillSymbol];
    if (Object.hasOwn(skill, "type") && skill.type !== type)
      throw new Error(`Cannot have multiple skill types for ${String(ctx.name)}`);
    skill.type = type;
    skill.gainEnergy = skill.gainEnergy ?? type !== "burst";
    skill.name = String(ctx.name);
    return target;
  };
}

export const Normal = addSkillType("normal");
export const Skill = addSkillType("skill");
export const Burst = addSkillType("burst");
export function NoEnergy(
  target: SkillSignature,
  ctx: ClassMethodDecoratorContext
) {
  addSkill(target);
  const skill = target[skillSymbol];
  skill.gainEnergy = false;
  return target;
}
const passiveSymbol: unique symbol = Symbol("passive");
export function Passive(name: string) {
  return function (target: any, ctx: ClassMethodDecoratorContext) {
    Object.defineProperty(target, passiveSymbol, { value: true });
    return target;
  };
}

export function Prepared(round: number) {
  return (target: any, ctx: ClassMethodDecoratorContext): SkillMethod => {
    addSkill(target);
    const skill = target[skillSymbol];
    if (Object.hasOwn(skill, "type") && skill.type !== "prepared"){
      throw new Error(`Cannot have multiple skill types for ${String(ctx.name)}`);
    }
    skill.type = "prepared";
    // @ts-ignore
    skill.round = round;
    skill.name = String(ctx.name);
    return target;
  };
}

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
        if (skill.type === "prepared") {
          throw new Error(
            `Cannot add costs to prepared skill ${String(ctx.name)}`
          );
        }
        skill.costs = skill.costs ?? [];
        skill.costs.push(...new Array(value).fill(type));
        return target;
      } else {
        if (!(cardSymbol in target)) {
          target[cardSymbol] = { costs: [] };
        }
        target[cardSymbol].costs.push(...new Array(value).fill(type));
        return target;
      }
    }
    return decorate;
  };
}

export const Void = cost(DiceType.VOID);
export const Cryo = cost(DiceType.CRYO);
export const Hydro = cost(DiceType.HYDRO);
export const Pyro = cost(DiceType.PYRO);
export const Electro = cost(DiceType.ELECTRO);
export const Anemo = cost(DiceType.ANEMO);
export const Geo = cost(DiceType.GEO);
export const Dendro = cost(DiceType.DENDRO);
export const Omni = cost(DiceType.OMNI);
export const Same = cost(DiceType.SAME);
export const Energy = cost(DiceType.ENERGY);

export const statusSymbol: unique symbol = Symbol("status");

export interface StatusInfoWithName extends StatusInfo {
  name: string;
}
// export interface StatusData {
//   info: StatusInfoWithName;
//   constructor: IStatusConstructor;
// }

export function Status(info: StatusInfo) {
  return (target: any, ctx: ClassDecoratorContext): any => {
    if (statusSymbol in target) {
      throw new Error("Decorating multiple times");
    }
    target[statusSymbol] = { ...info, name: String(ctx.name) };
    return target;
  };
}

export const summonSymbol: unique symbol = Symbol("summon");

export function Summon(info: StatusInfo) {
  return (target: any, ctx: ClassDecoratorContext): any => {
    if (statusSymbol in target) {
      throw new Error("Decorating multiple times");
    }
    target[summonSymbol] = { ...info, name: String(ctx.name) };
    return target;
  };
}

export const cardSymbol: unique symbol = Symbol("card");
export interface CardData {
  info: CardInfo;
  costs: number[];
  ctor: ICardConstructor;
}

export function Card(info: CardInfo) {
  return (target: any, ctx: ClassDecoratorContext): any => {
    if (!(cardSymbol in target)) {
      target[cardSymbol] = { costs: [] };
    }
    target[cardSymbol].info = info;
    target[cardSymbol].ctor = target;
    return target;
  };
}
