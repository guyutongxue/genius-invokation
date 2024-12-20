import { AnyState } from "@gi-tcg/core";
import { expect, MatcherResult } from "bun:test";

function toHaveVariable(
  actual: unknown,
  varName: string,
  expected: number,
): MatcherResult {
  if (!Array.isArray(actual)) {
    throw new TypeError(`We are expecting an array of states`);
  }
  if (actual.length !== 1) {
    return {
      pass: false,
      message: () => `Expected exactly 1 state, but got ${actual.length}`,
    };
  }
  const state: AnyState = actual[0];
  const variables = state.variables as Record<string, any>;
  if (variables[varName] !== expected) {
    return {
      pass: false,
      message: () =>
        `Expected ${varName} to be ${expected}, but got ${variables[varName]}`,
    };
  }
  return {
    pass: true,
    message: () => "",
  };
}

expect.extend({ toHaveVariable });

declare module "bun:test" {
  interface Matchers<T = unknown> {
    toHaveVariable(varName: string, expected: number): void;
  }
}
