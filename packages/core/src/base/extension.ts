import { SkillDefinition } from "./skill";

export interface ExtensionDefinition {
  readonly id: number;
  readonly initialState: unknown;
  readonly skills: readonly SkillDefinition[];
}
