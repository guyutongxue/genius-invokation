import { DiceType } from "@jenshin-tcg/typings";
import { CharacterInfo, DescriptionContext, SkillInfo, SkillType } from ".";


export interface CharacterConstructor {
  new(): any;
  info: CharacterInfo;
  skill: (SkillInfo & { do: (c: DescriptionContext) => void })[];
}

export function Character(info: CharacterInfo) {
  return (target: any, ctx: ClassDecoratorContext): CharacterConstructor => {
    if (target.info) throw new Error("Decorating multiple times");
    target.info = info;
    target.skill = [];
    for (const key of Object.getOwnPropertyNames(target.prototype)) {
      const method = target.prototype[key];
      if (method[skillSymbol]) {
        const skill = method[skillSymbol];
        skill.do = method;
        target.skill.push(skill);
      }
    }
    return target;
  }
}

const skillSymbol: unique symbol = Symbol("skill");
export function getSkill(method: any): SkillInfo {
  method[skillSymbol] = method[skillSymbol] ?? {};
  return method[skillSymbol];
}

function cost(type: DiceType) {
  return (value: number) => {
    return (target: any, ctx: ClassMethodDecoratorContext) => {
      const skill = getSkill(target);
      skill.costs = skill.costs ?? {};
      skill.costs[type] = value;
      return target;
    }
  }
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

function addType(type: SkillType) {
  return (target: any, ctx: ClassMethodDecoratorContext) => {
    const skill = getSkill(target);
    const name = String(ctx.name)
    if (skill.type) throw new Error(`Cannot have multiple types for ${String(name)}`);
    skill.type = type;
    skill.name = name;
    return target;
  }
}

export const Normal = addType("normal");
export const Skill = addType("skill");
export const Burst = addType("burst");

export interface StatusConfig {
  duration?: number;
  usage?: number;
}

function addStatus(combat: boolean) {
  return (config: StatusConfig) => {
    return (target: any, ctx: ClassDecoratorContext) => {

    }
  }
}

export const Status = addStatus(false);
export const CombatStatus = addStatus(true);
